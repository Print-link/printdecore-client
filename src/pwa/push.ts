import axios from "axios";
import { BASE_URL, getAuthHeaders } from "../services/orderApi";
import { isIOS, isStandalone, pushSupported } from "./platform";

/**
 * Order notifications through Web Push: works in Chrome, Edge, Firefox and
 * Android, and on iPhone/iPad once the app is added to the home screen
 * (iOS 16.4+). One shared state, so every "turn on alerts" button agrees.
 */
export type PushState =
	| "loading"
	/** The browser can't do push at all */
	| "unsupported"
	/** iPhone/iPad in a browser tab: install to the home screen first */
	| "needs-install"
	/** The customer blocked notifications for this site */
	| "denied"
	| "off"
	| "on"
	/** The server isn't set up for web push yet */
	| "unavailable";

let state: PushState = "loading";
const listeners = new Set<() => void>();
const set = (s: PushState) => {
	state = s;
	listeners.forEach((l) => l());
};

export const pushStore = {
	subscribe: (l: () => void) => {
		listeners.add(l);
		return () => {
			listeners.delete(l);
		};
	},
	get: () => state,
};

const base64ToBytes = (b64: string) => {
	const s = (b64 + "=".repeat((4 - (b64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
	const raw = atob(s);
	return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

let keyPromise: Promise<string | null> | null = null;
const publicKey = () => {
	keyPromise ??= axios
		.get<{ data?: { publicKey?: string | null } }>(`${BASE_URL}/notifications/web-push/key`)
		.then((r) => r.data?.data?.publicKey ?? null)
		.catch(() => {
			keyPromise = null;
			return null;
		});
	return keyPromise;
};

const registration = () => navigator.serviceWorker.ready;

const save = (sub: PushSubscription) =>
	axios.post(`${BASE_URL}/notifications/web-push/subscribe`, { subscription: sub.toJSON() }, { headers: getAuthHeaders() });

/**
 * Work out where this browser stands. Signed in with alerts already on: make
 * sure the server has this browser under this account (a new sign-in, or a
 * subscription the browser rotated).
 */
export const refreshPush = async (signedIn: boolean) => {
	if (isIOS && !isStandalone()) return set("needs-install");
	if (!pushSupported()) return set("unsupported");
	if (Notification.permission === "denied") return set("denied");
	try {
		const sub = await (await registration()).pushManager.getSubscription();
		if (sub && Notification.permission === "granted") {
			if (signedIn) save(sub).catch(() => {});
			return set("on");
		}
		set("off");
	} catch {
		set("off");
	}
};

/** Ask for permission and subscribe. Must run from a tap. */
export const enablePush = async (): Promise<PushState> => {
	if (isIOS && !isStandalone()) {
		set("needs-install");
		return state;
	}
	if (!pushSupported()) {
		set("unsupported");
		return state;
	}
	const key = await publicKey();
	if (!key) {
		set("unavailable");
		return state;
	}
	const permission = await Notification.requestPermission();
	if (permission !== "granted") {
		set(permission === "denied" ? "denied" : "off");
		return state;
	}
	const reg = await registration();
	let sub = await reg.pushManager.getSubscription();
	// A subscription made with another key can't receive our pushes
	if (sub && sub.options.applicationServerKey) {
		const current = new Uint8Array(sub.options.applicationServerKey);
		const wanted = base64ToBytes(key);
		if (current.length !== wanted.length || current.some((b, i) => b !== wanted[i])) {
			await sub.unsubscribe();
			sub = null;
		}
	}
	sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64ToBytes(key) });
	await save(sub);
	set("on");
	return state;
};

/** Stop notifications on this browser */
export const disablePush = async () => {
	try {
		const sub = await (await registration()).pushManager.getSubscription();
		if (sub) {
			await axios.post(`${BASE_URL}/notifications/web-push/unsubscribe`, { endpoint: sub.endpoint }, { headers: getAuthHeaders() }).catch(() => {});
			await sub.unsubscribe();
		}
	} finally {
		set(pushSupported() && Notification.permission === "denied" ? "denied" : "off");
	}
};

/** Signing out: this browser stops getting this account's notifications. Never holds sign-out up for long. */
export const detachPushOnSignOut = async () => {
	if (!pushSupported()) return;
	await Promise.race([disablePush().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
};

/** A test notification to this account's devices */
export const sendTestPush = () => axios.post(`${BASE_URL}/notifications/web-push/test`, {}, { headers: getAuthHeaders() });

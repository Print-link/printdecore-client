import { isStandalone } from "./platform";

/**
 * Installing the app. Chrome, Edge and Android offer a real install prompt
 * (beforeinstallprompt), which must be caught early and kept for when the
 * customer taps Install. iPhone has no prompt: the guide walks them through
 * Safari's Add to Home Screen instead.
 */
type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };

let deferred: InstallPromptEvent | null = null;
let installed = isStandalone();
let guideOpen = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

if (typeof window !== "undefined") {
	window.addEventListener("beforeinstallprompt", (e) => {
		e.preventDefault();
		deferred = e as InstallPromptEvent;
		emit();
	});
	window.addEventListener("appinstalled", () => {
		deferred = null;
		installed = true;
		guideOpen = false;
		emit();
	});
}

export const installStore = {
	subscribe: (l: () => void) => {
		listeners.add(l);
		return () => {
			listeners.delete(l);
		};
	},
	snapshot: () => `${!!deferred}|${installed}|${guideOpen}`,
	canPrompt: () => !!deferred,
	installed: () => installed,
	guideOpen: () => guideOpen,
};

/** Show the browser's own install prompt. Returns true if they installed. */
export const promptInstall = async (): Promise<boolean> => {
	if (!deferred) return false;
	const e = deferred;
	deferred = null;
	emit();
	await e.prompt();
	const { outcome } = await e.userChoice;
	return outcome === "accepted";
};

export const openInstallGuide = () => {
	guideOpen = true;
	emit();
};
export const closeInstallGuide = () => {
	guideOpen = false;
	emit();
};

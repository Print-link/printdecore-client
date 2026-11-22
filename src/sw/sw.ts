/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { cleanupOutdatedCaches, createHandlerBoundToURL, precacheAndRoute } from "workbox-precaching";
import { NavigationRoute, registerRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> };

/*
 * Printdecore's service worker: the app works offline-first like an
 * installed app (precached shell), and it shows push notifications about
 * orders — even when the app is closed — opening the right page on tap.
 */

// ── App shell: cached at install, so it opens instantly and offline ──
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
registerRoute(new NavigationRoute(createHandlerBoundToURL("/index.html"), { denylist: [/^\/api/, /^\/payment\/callback/] }));

// New versions take over straight away (the app shows "A new version is available")
self.skipWaiting();
clientsClaim();
self.addEventListener("message", (event) => {
	if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

// ── Push notifications ──
type Payload = { title?: string; body?: string; url?: string; tag?: string; data?: Record<string, string> };

self.addEventListener("push", (event) => {
	let payload: Payload = {};
	try {
		payload = event.data?.json() ?? {};
	} catch {
		payload = { body: event.data?.text() };
	}
	const title = payload.title || "Printdecore";
	const url = payload.url || payload.data?.url || "/home/history";

	event.waitUntil(
		(async () => {
			await self.registration.showNotification(title, {
				body: payload.body,
				icon: "/logoIcon-192.png",
				badge: "/logoIcon-192.png",
				tag: payload.tag,
				// A newer update about the same order still buzzes
				renotify: !!payload.tag,
				data: { url, ...(payload.data ?? {}) },
			} as NotificationOptions);
			// Open app windows refresh that order now instead of waiting for their next check
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			windows.forEach((w) => w.postMessage({ type: "PUSH_RECEIVED", url, data: payload.data ?? {} }));
		})()
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();
	const target = new URL((event.notification.data?.url as string) || "/home/history", self.location.origin).href;

	event.waitUntil(
		(async () => {
			const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
			// Reuse an open Printdecore window: take it to the page and bring it forward
			const existing = windows.find((w) => new URL(w.url).origin === self.location.origin);
			if (existing) {
				await existing.focus();
				if ("navigate" in existing) {
					try {
						await existing.navigate(target);
						return;
					} catch {
						// Some browsers refuse navigate() on an uncontrolled window: tell the app instead
					}
				}
				existing.postMessage({ type: "OPEN_URL", url: target });
				return;
			}
			await self.clients.openWindow(target);
		})()
	);
});

// The browser rotated the subscription: the app re-registers it next time it opens
self.addEventListener("pushsubscriptionchange", () => {
	// Nothing to do here without the user's sign-in token; usePush re-subscribes on launch.
});

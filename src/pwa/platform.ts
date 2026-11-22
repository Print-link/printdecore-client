/** What this device and browser can do, for installing the app and getting notifications */

const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";

/** iPhone, iPad (iPadOS reports itself as a Mac with touch), iPod */
export const isIOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && typeof navigator !== "undefined" && navigator.maxTouchPoints > 1);

export const isAndroid = /Android/i.test(ua);

/** Opened from the home screen / installed, not in a browser tab */
export const isStandalone = () =>
	typeof window !== "undefined" &&
	(window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);

/** An app's built-in browser (Instagram, Facebook, WhatsApp…): it can't install or notify */
export const inAppBrowser = /FBAN|FBAV|FB_IAB|Instagram|Line\/|Twitter|Snapchat|TikTok|musical_ly|WhatsApp|GSA\//i.test(ua);

/** On iOS, Safari is the browser that adds web apps to the home screen reliably */
export const isIOSSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|YaBrowser|DuckDuckGo|Brave/i.test(ua) && !inAppBrowser;

/** The iOS browser in use, to name it in the steps */
export const iosBrowserName = (() => {
	if (!isIOS) return null;
	if (/CriOS/.test(ua)) return "Chrome";
	if (/FxiOS/.test(ua)) return "Firefox";
	if (/EdgiOS/.test(ua)) return "Edge";
	if (/OPiOS|OPT\//.test(ua)) return "Opera";
	if (/Instagram/.test(ua)) return "Instagram";
	if (/FBAN|FBAV|FB_IAB/.test(ua)) return "Facebook";
	if (/WhatsApp/.test(ua)) return "WhatsApp";
	if (/GSA\//.test(ua)) return "the Google app";
	return isIOSSafari ? "Safari" : "this browser";
})();

/** iOS version, e.g. 17.4 — web push needs 16.4 or later, from the home screen */
export const iosVersion = (() => {
	const m = ua.match(/OS (\d+)_(\d+)/);
	return isIOS && m ? Number(m[1]) + Number(m[2]) / 10 : null;
})();

/** This browser can receive push notifications right now (on iOS: only once installed) */
export const pushSupported = () =>
	typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;

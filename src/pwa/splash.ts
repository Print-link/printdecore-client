declare global {
	interface Window {
		/** Set by the inline launch splash in index.html */
		__pdSplashReady?: () => void;
	}
}

/**
 * The app's first screen is ready: the launch splash (installed app only)
 * finishes its animation and hands over. Safe to call more than once, and a
 * no-op when there's no splash.
 */
export const splashReady = () => {
	// After the next paint, so the app is on screen underneath when it fades
	requestAnimationFrame(() => requestAnimationFrame(() => window.__pdSplashReady?.()));
};

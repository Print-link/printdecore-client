import { useSyncExternalStore } from "react";
import { installStore } from "../pwa/install";
import { pushStore } from "../pwa/push";

/** Where this browser stands on order notifications */
export const usePushState = () => useSyncExternalStore(pushStore.subscribe, pushStore.get);

/** Whether the app is installed, can show the browser's install prompt, and whether the install guide is open */
export const useInstall = () => {
	useSyncExternalStore(installStore.subscribe, installStore.snapshot);
	return { installed: installStore.installed(), canPrompt: installStore.canPrompt(), guideOpen: installStore.guideOpen() };
};

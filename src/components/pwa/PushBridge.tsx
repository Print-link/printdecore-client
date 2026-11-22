import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { refreshPush } from "../../pwa/push";

/**
 * Connects push notifications to the open app: works out whether alerts are
 * on for this browser (and re-registers it under the signed-in account), and
 * when a notification arrives while the app is open, refreshes the orders at
 * once. A tap on a notification that the service worker couldn't navigate to
 * is opened here.
 */
export const PushBridge = ({ signedIn }: { signedIn: boolean }) => {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	useEffect(() => {
		refreshPush(signedIn);
	}, [signedIn]);

	useEffect(() => {
		if (!("serviceWorker" in navigator)) return;
		const onMessage = (e: MessageEvent) => {
			const msg = e.data as { type?: string; url?: string; data?: Record<string, string> } | undefined;
			if (msg?.type === "PUSH_RECEIVED") {
				const { orderId, printRequestId } = msg.data ?? {};
				queryClient.invalidateQueries({ queryKey: ["orders"] });
				if (orderId) queryClient.invalidateQueries({ queryKey: ["order", orderId] });
				if (printRequestId) {
					queryClient.invalidateQueries({ queryKey: ["printRequest", printRequestId] });
					queryClient.invalidateQueries({ queryKey: ["printRequestMessages", printRequestId] });
				}
			}
			if (msg?.type === "OPEN_URL" && msg.url) {
				const url = new URL(msg.url, window.location.origin);
				if (url.origin === window.location.origin) navigate(url.pathname + url.search);
			}
		};
		navigator.serviceWorker.addEventListener("message", onMessage);
		return () => navigator.serviceWorker.removeEventListener("message", onMessage);
	}, [queryClient, navigate]);

	return null;
};

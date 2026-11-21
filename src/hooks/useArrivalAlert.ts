import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

/**
 * Watches a waiting request: when it stops waiting while the page is open
 * (the price arrived, the shop confirmed), it celebrates — a toast, a buzz on
 * phones, and a system alert if the customer asked for one. Returns true from
 * that moment, so the page can show the news big.
 */
export const useArrivalAlert = (waiting: boolean | undefined, message: string) => {
	const wasWaiting = useRef(false);
	const [arrived, setArrived] = useState(false);

	useEffect(() => {
		if (waiting === undefined) return;
		if (waiting) {
			wasWaiting.current = true;
			return;
		}
		if (!wasWaiting.current) return;
		wasWaiting.current = false;
		setArrived(true);
		toast.success(message);
		try {
			navigator.vibrate?.([80, 60, 80]);
		} catch {
			// Not supported: the toast is enough
		}
		try {
			if ("Notification" in window && Notification.permission === "granted" && document.visibilityState !== "visible") {
				new Notification("Printdecore", { body: message, icon: "/logoIcon-192.png" });
			}
		} catch {
			// Some browsers only allow alerts from the service worker
		}
	}, [waiting, message]);

	return arrived;
};

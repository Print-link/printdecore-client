import { useState } from "react";
import { BellRinging, BellSlash, CheckCircle, DeviceMobile, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { usePushState } from "../../hooks/usePwa";
import { openInstallGuide } from "../../pwa/install";
import { enablePush, sendTestPush } from "../../pwa/push";

/**
 * "Turn on order alerts", wherever a customer is waiting on something. On an
 * iPhone in a browser tab it opens the install steps instead (iPhone only
 * notifies from the home-screen app). Shows the real state once it's on.
 */
export const AlertsButton = ({ size = "sm" }: { size?: "sm" | "md" }) => {
	const state = usePushState();
	const [busy, setBusy] = useState(false);
	const pad = size === "md" ? "px-4 py-2.5 text-sm" : "px-3 py-2 text-xs";

	if (state === "loading" || state === "unsupported" || state === "unavailable") return null;

	if (state === "on") {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 font-semibold text-emerald-700 dark:text-emerald-400 ${pad}`}>
				<CheckCircle size={15} weight="fill" /> Alerts on — even when the app is closed
			</span>
		);
	}
	if (state === "denied") {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-xl bg-gray-100 dark:bg-white/5 font-semibold text-gray-600 dark:text-gray-400 ${pad}`} title="Allow notifications for this site in your browser settings">
				<BellSlash size={15} /> Notifications are blocked in your browser settings
			</span>
		);
	}
	if (state === "needs-install") {
		return (
			<button type="button" onClick={openInstallGuide} className={`tap inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-[#fbbf24] font-bold text-white dark:text-black ${pad}`}>
				<DeviceMobile size={15} weight="fill" /> Get alerts on your iPhone
			</button>
		);
	}
	return (
		<button
			type="button"
			disabled={busy}
			onClick={async () => {
				setBusy(true);
				try {
					const result = await enablePush();
					if (result === "on") {
						toast.success("Order alerts are on");
						sendTestPush().catch(() => { });
					} else if (result === "denied") toast.info("Notifications were blocked. You can allow them in your browser settings.");
					else if (result === "unavailable") toast.info("Order alerts aren't available yet — we'll still show updates here.");
				} catch {
					toast.error("Couldn't turn on alerts. Please try again.");
				} finally {
					setBusy(false);
				}
			}}
			className={`tap inline-flex items-center gap-1.5 rounded-xl bg-gray-900 dark:bg-[#fbbf24] font-bold text-white dark:text-black disabled:opacity-60 ${pad}`}
		>
			{busy ? <SpinnerGap size={15} className="animate-spin" /> : <BellRinging size={15} weight="fill" />} Turn on order alerts
		</button>
	);
};

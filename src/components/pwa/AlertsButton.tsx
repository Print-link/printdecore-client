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
	const pad = size === "md" ? "h-10 px-4 text-sm" : "h-8 px-3 text-sm";

	if (state === "loading" || state === "unsupported" || state === "unavailable") return null;

	if (state === "on") {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-lg bg-ok-tint font-semibold text-ok ${pad}`}>
				<CheckCircle size={15} /> Alerts on — even when the app is closed
			</span>
		);
	}
	if (state === "denied") {
		return (
			<span className={`inline-flex items-center gap-1.5 rounded-lg bg-fill font-semibold text-ink-2 ${pad}`} title="Allow notifications for this site in your browser settings">
				<BellSlash size={15} /> Notifications are blocked in your browser settings
			</span>
		);
	}
	if (state === "needs-install") {
		return (
			<button type="button" onClick={openInstallGuide} className={`tap inline-flex items-center gap-1.5 rounded-lg bg-ink font-semibold text-page ${pad}`}>
				<DeviceMobile size={15} /> Get alerts on your iPhone
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
			className={`tap inline-flex items-center gap-1.5 rounded-lg bg-ink font-semibold text-page disabled:opacity-60 ${pad}`}
		>
			{busy ? <SpinnerGap size={15} className="animate-spin" /> : <BellRinging size={15} />} Turn on order alerts
		</button>
	);
};

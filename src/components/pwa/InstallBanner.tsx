import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useInstall } from "../../hooks/usePwa";
import { openInstallGuide, promptInstall } from "../../pwa/install";
import { inAppBrowser, isIOS } from "../../pwa/platform";
import { Button } from "../ui";

const KEY = "pd_install_banner_hidden_until";
const hiddenNow = () => {
	try {
		return Number(localStorage.getItem(KEY) || 0) > Date.now();
	} catch {
		return false;
	}
};

/**
 * On Home, for people using Printdecore in a browser: get the app. Shown
 * where installing is possible (iPhone, or a browser offering its install
 * prompt); "Not now" hides it for two weeks.
 */
export const InstallBanner = () => {
	const { installed, canPrompt } = useInstall();
	const [hidden, setHidden] = useState(hiddenNow);
	if (installed || hidden || !(isIOS || canPrompt || inAppBrowser)) return null;

	const dismiss = () => {
		try {
			localStorage.setItem(KEY, String(Date.now() + 14 * 864e5));
		} catch {
			// Storage blocked: hide for this visit
		}
		setHidden(true);
	};

	return (
		<section className="mb-5 flex items-center gap-3 rounded-xl border border-line bg-surface p-3" aria-label="Get the app">
			<img src="/logoIcon-192.png" alt="" className="w-10 h-10 shrink-0 rounded-lg bg-white ring-1 ring-inset ring-line" />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-semibold text-ink">Get the Printdecore app</p>
				<p className="text-xs text-ink-2">Alerts when your price is ready. Free, no app store.</p>
			</div>
			<Button
				size="sm"
				onClick={async () => {
					if (canPrompt && !isIOS) await promptInstall();
					else openInstallGuide();
				}}
			>
				{canPrompt && !isIOS ? "Install" : "How?"}
			</Button>
			<button type="button" onClick={dismiss} className="tap shrink-0 -mr-1 p-1.5 rounded-full text-ink-3 hover:bg-fill" aria-label="Not now">
				<X size={14} weight="bold" />
			</button>
		</section>
	);
};

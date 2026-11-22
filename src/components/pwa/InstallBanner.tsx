import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useInstall } from "../../hooks/usePwa";
import { openInstallGuide, promptInstall } from "../../pwa/install";
import { inAppBrowser, isIOS } from "../../pwa/platform";

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
		<section className="chat-in mb-5 flex items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] p-3 shadow-sm" aria-label="Get the app">
			<img src="/logoIcon-192.png" alt="" className="w-11 h-11 shrink-0 rounded-xl bg-white ring-1 ring-black/5" />
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-gray-900 dark:text-white">Get the Printdecore app</p>
				<p className="text-xs text-gray-500 dark:text-gray-400">Instant alerts when your price is ready. Free, no app store.</p>
			</div>
			<button
				type="button"
				onClick={async () => {
					if (canPrompt && !isIOS) await promptInstall();
					else openInstallGuide();
				}}
				className="tap shrink-0 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] px-3.5 py-2 text-xs font-black text-black"
			>
				{canPrompt && !isIOS ? "Install" : "How?"}
			</button>
			<button type="button" onClick={dismiss} className="shrink-0 -mr-1 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Not now">
				<X size={14} weight="bold" />
			</button>
		</section>
	);
};

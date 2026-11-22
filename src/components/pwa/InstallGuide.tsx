import { useState, type ReactNode } from "react";
import { BellRinging, Check, Copy, DotsThreeOutline, DotsThreeVertical, Export, Lightning, PlusSquare, X } from "@phosphor-icons/react";
import { closeInstallGuide, promptInstall } from "../../pwa/install";
import { inAppBrowser, iosBrowserName, iosVersion, isAndroid, isIOS, isIOSSafari } from "../../pwa/platform";
import { useInstall } from "../../hooks/usePwa";

const Step = ({ n, title, children, muted }: { n: number; title: ReactNode; children?: ReactNode; muted?: boolean }) => (
	<li className={`flex gap-3 ${muted ? "opacity-60" : ""}`}>
		<span className="w-7 h-7 shrink-0 rounded-full bg-[#fbbf24] text-black text-sm font-black flex items-center justify-center">{n}</span>
		<div className="min-w-0 pt-0.5">
			<p className="text-sm font-bold text-gray-900 dark:text-white">{title}</p>
			{children && <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">{children}</div>}
		</div>
	</li>
);

/** An icon as it looks in the browser's toolbar, so they can find it */
const Key = ({ children }: { children: ReactNode }) => (
	<span className="inline-flex items-center gap-1 align-middle rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#222] px-1.5 py-0.5 text-[11px] font-semibold text-gray-800 dark:text-gray-200">
		{children}
	</span>
);

const SafariSteps = ({ start = 1, muted = false }: { start?: number; muted?: boolean }) => (
	<>
		<Step n={start} muted={muted} title={<>Tap the Share button <Key><Export size={13} weight="bold" /> Share</Key></>}>
			At the bottom of Safari on iPhone (top right on iPad). If you don't see it, tap the page once to show the toolbar.
		</Step>
		<Step n={start + 1} muted={muted} title={<>Tap <Key><PlusSquare size={13} weight="bold" /> Add to Home Screen</Key></>}>
			Scroll down the list if it's not visible. Can't find it? Tap <b>Edit Actions</b> at the bottom and add it.
		</Step>
		<Step n={start + 2} muted={muted} title={<>Tap <Key>Add</Key> in the top-right corner</>} />
		<Step n={start + 3} muted={muted} title="Open Printdecore from your Home Screen">
			Then tap <b>Turn on order alerts</b> — you'll get notified the moment your price is ready, even when the app is closed.
		</Step>
	</>
);

/**
 * How to install the app on this device. iPhone in another browser: open the
 * page in Safari first. iPhone in Safari: Add to Home Screen. Chrome / Edge /
 * Android: the browser's own install prompt, or where to find it.
 */
export const InstallGuide = () => {
	const { guideOpen, canPrompt, installed } = useInstall();
	const [copied, setCopied] = useState(false);
	if (!guideOpen) return null;

	const link = `${window.location.origin}/home`;
	const copy = async () => {
		try {
			await navigator.clipboard.writeText(link);
		} catch {
			// Older browsers: select-and-copy through a hidden field
			const field = document.createElement("textarea");
			field.value = link;
			document.body.appendChild(field);
			field.select();
			document.execCommand("copy");
			field.remove();
		}
		setCopied(true);
		window.setTimeout(() => setCopied(false), 2500);
	};

	const oldIOS = iosVersion !== null && iosVersion < 16.4;

	let body: ReactNode;
	if (installed) {
		body = <p className="text-sm text-gray-600 dark:text-gray-400">Printdecore is already installed on this device. Open it from your home screen.</p>;
	} else if (isIOS && !isIOSSafari) {
		body = (
			<>
				<div className="rounded-2xl bg-amber-50 dark:bg-amber-400/10 border border-amber-200 dark:border-amber-400/20 p-3.5 text-sm text-gray-800 dark:text-gray-200">
					You're using <b>{iosBrowserName}</b>. On iPhone, the app is added to your Home Screen from <b>Safari</b> — it takes a few seconds.
				</div>
				<p className="mt-4 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">First, open this page in Safari</p>
				<ol className="space-y-3.5">
					{inAppBrowser ? (
						<>
							<Step n={1} title={<>Tap the menu <Key><DotsThreeOutline size={13} weight="fill" /></Key> or the share icon</>}>
								Usually at the top or bottom right of {iosBrowserName}.
							</Step>
							<Step n={2} title={<>Choose <Key>Open in Safari</Key> or <Key>Open in browser</Key></>}>
								No such option? Copy the link instead and paste it into Safari:
								<CopyLink link={link} copied={copied} onCopy={copy} />
							</Step>
						</>
					) : (
						<>
							<Step n={1} title="Copy the link to Printdecore">
								<CopyLink link={link} copied={copied} onCopy={copy} />
							</Step>
							<Step n={2} title={<>Open the <b>Safari</b> app</>}>The blue compass icon on your Home Screen.</Step>
							<Step n={3} title="Paste the link into the address bar and go">Tap the address bar, then tap <b>Paste and Go</b>.</Step>
						</>
					)}
				</ol>
				<p className="mt-5 mb-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">Then, in Safari</p>
				<ol className="space-y-3.5">
					<SafariSteps start={inAppBrowser ? 3 : 4} muted />
				</ol>
			</>
		);
	} else if (isIOS) {
		body = (
			<ol className="space-y-3.5">
				<SafariSteps />
			</ol>
		);
	} else if (canPrompt) {
		body = (
			<button
				type="button"
				onClick={async () => {
					if (await promptInstall()) closeInstallGuide();
				}}
				className="tap w-full py-3.5 rounded-2xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black"
			>
				Install Printdecore
			</button>
		);
	} else if (isAndroid) {
		body = (
			<ol className="space-y-3.5">
				<Step n={1} title={<>Tap the browser menu <Key><DotsThreeVertical size={13} weight="bold" /></Key></>}>Top right in Chrome.</Step>
				<Step n={2} title={<>Tap <Key>Install app</Key> or <Key>Add to Home screen</Key></>} />
				<Step n={3} title="Open Printdecore from your home screen and turn on order alerts" />
			</ol>
		);
	} else {
		body = (
			<ol className="space-y-3.5">
				<Step n={1} title="In Chrome or Edge, click the install icon in the address bar">
					A small screen with a down arrow, at the right end of the address bar. Or open the browser menu and choose <b>Install Printdecore</b>.
				</Step>
				<Step n={2} title="On a Mac in Safari: File › Add to Dock" />
			</ol>
		);
	}

	return (
		<div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Install the Printdecore app">
			<div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={closeInstallGuide} />
			<div className="sheet-up absolute bottom-0 inset-x-0 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:bottom-8 md:w-[440px] max-h-[90dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-white dark:bg-[#1a1a1a] pb-safe shadow-2xl">
				<div className="sticky top-0 bg-white dark:bg-[#1a1a1a] px-5 pt-3 pb-3 flex items-start gap-3 border-b border-gray-100 dark:border-gray-800">
					<img src="/logoIcon-192.png" alt="" className="w-12 h-12 rounded-2xl bg-white ring-1 ring-black/5" />
					<div className="flex-1 min-w-0">
						<p className="text-base font-black text-gray-900 dark:text-white">Get the Printdecore app</p>
						<p className="text-xs text-gray-500 dark:text-gray-400">Free · no app store · takes a few seconds</p>
					</div>
					<button type="button" onClick={closeInstallGuide} className="p-2 -mr-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Close">
						<X size={18} weight="bold" />
					</button>
				</div>
				<div className="px-5 py-4">
					<ul className="mb-5 grid grid-cols-3 gap-2 text-center">
						{[
							{ icon: <BellRinging size={18} weight="duotone" />, text: "Alerts when your price is ready" },
							{ icon: <Lightning size={18} weight="duotone" />, text: "Opens instantly, full screen" },
							{ icon: <Check size={18} weight="bold" />, text: "Track every order live" },
						].map((b) => (
							<li key={b.text} className="rounded-xl bg-gray-50 dark:bg-white/[0.03] px-2 py-2.5">
								<span className="mx-auto w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-400/15 text-[#b45309] dark:text-amber-300 flex items-center justify-center">{b.icon}</span>
								<span className="mt-1.5 block text-[11px] leading-tight font-semibold text-gray-700 dark:text-gray-300">{b.text}</span>
							</li>
						))}
					</ul>
					{body}
					{isIOS && oldIOS && (
						<p className="mt-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] p-3 text-xs text-gray-600 dark:text-gray-400">
							Order alerts on iPhone need iOS 16.4 or later. Update in <b>Settings › General › Software Update</b> — the app still works without it.
						</p>
					)}
				</div>
			</div>
		</div>
	);
};

const CopyLink = ({ link, copied, onCopy }: { link: string; copied: boolean; onCopy: () => void }) => (
	<span className="mt-2 flex items-center gap-2">
		<span className="flex-1 min-w-0 truncate rounded-lg bg-gray-100 dark:bg-gray-800 px-2.5 py-2 font-mono text-[11px] text-gray-700 dark:text-gray-300">{link}</span>
		<button
			type="button"
			onClick={onCopy}
			className={`tap shrink-0 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-bold ${copied ? "bg-emerald-500 text-white" : "bg-gray-900 text-white dark:bg-white dark:text-black"}`}
		>
			{copied ? <Check size={13} weight="bold" /> : <Copy size={13} weight="bold" />} {copied ? "Copied" : "Copy link"}
		</button>
	</span>
);

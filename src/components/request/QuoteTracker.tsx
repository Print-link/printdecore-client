import { useEffect, useState, type ReactNode } from "react";
import { Check, ChatCircleText, ShieldCheck, SignOut } from "@phosphor-icons/react";
import { PrintyMascot } from "../assistant/PrintyMascot";
import { AlertsButton } from "../pwa/AlertsButton";

/**
 * How long a reply usually takes, in minutes. The copy promises these, so
 * keep them true: "confirm" matches the "about 10 minutes" the order card
 * already promises; "quote" is a custom job priced by a person; "accept" is
 * a paid shop order waiting for the shop to accept it.
 */
const TYPICAL_MINUTES = { confirm: 10, quote: 30, accept: 15 } as const;

type Kind = keyof typeof TYPICAL_MINUTES;

const ago = (ms: number) => {
	const m = Math.floor(ms / 60000);
	if (m < 1) return "just now";
	if (m < 60) return `${m} min ago`;
	const h = Math.floor(m / 60);
	return h < 24 ? `${h} h ${m % 60} min ago` : `${Math.floor(h / 24)} day${h >= 48 ? "s" : ""} ago`;
};

/**
 * While a customer waits for a price (or for a shop to confirm), this shows
 * the job moving: it's received, someone is on it right now, the price is
 * next, and they don't need to stay. Everything it says is true — the steps
 * come from the real status, the page checks for news every few seconds,
 * and the timing copy turns honest if it's running late.
 */
export const QuoteTracker = ({
	kind,
	createdAt,
	shopName,
	lastChecked,
	onAddDetails,
}: {
	/** "confirm": priced, the shop is confirming. "quote": waiting for a price. "accept": paid, the shop is accepting. */
	kind: Kind;
	createdAt?: string;
	/** Who is on it; the Printdecore team when not set */
	shopName?: string;
	/** When the page last checked for news (ms) */
	lastChecked?: number;
	/** Scroll to the message box: something useful to do meanwhile */
	onAddDetails?: () => void;
}) => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 5000);
		return () => window.clearInterval(id);
	}, []);

	const sentAt = createdAt ? new Date(createdAt).getTime() : now;
	const elapsed = Math.max(0, now - sentAt);
	const typical = TYPICAL_MINUTES[kind] * 60000;
	const late = elapsed > typical;
	const who = shopName ?? "The Printdecore team";
	// The current step fills with time, easing out: it never claims to be done
	const fill = Math.min(0.92, 1 - Math.exp((-1.6 * elapsed) / typical));
	const progress = 25 + 25 * fill;

	const shop = shopName ?? "The shop";
	const title = kind === "confirm" ? `${shop} is confirming your order` : kind === "accept" ? `${shop} is accepting your order` : "Your price is on its way";
	const timing = late
		? "Taking a little longer than usual — it's still being worked on, and you'll be alerted the moment it's ready."
		: kind === "quote"
			? `Most prices arrive within ${TYPICAL_MINUTES.quote} minutes.`
			: `Usually ${kind === "accept" ? "accepted" : "confirmed"} within ${TYPICAL_MINUTES[kind]} minutes.`;

	const STEPS: Record<Kind, [string, string, string, string]> = {
		quote: ["Request received", `${who} is pricing your job`, "Your price arrives", "You pay, printing starts"],
		confirm: ["Order received", `${who} is checking price and stock`, "Confirmed — ready-by time set", "Printing starts"],
		accept: ["Paid — order received", `${who} is reviewing your order`, "Accepted — ready-by time set", "Printing starts"],
	};
	const [received, active, next, later] = STEPS[kind];
	const steps = [
		// When it was sent is in "Sent … ago" above, so no time here
		{ label: received, note: "", state: "done" as const },
		{ label: active, note: "Now", state: "active" as const },
		{ label: next, note: "Next — we'll alert you", state: "next" as const },
		{ label: later, note: "", state: "later" as const },
	];

	return (
		<section
			className="relative overflow-hidden rounded-3xl border border-amber-200/80 dark:border-amber-500/20 bg-gradient-to-br from-amber-50 via-white to-white dark:from-amber-400/[0.07] dark:via-[#1a1a1a] dark:to-[#1a1a1a] p-5 sm:p-6 mb-5"
			aria-live="polite"
		>
			<span className="printy-glow pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full bg-amber-300/25 dark:bg-amber-400/10 blur-3xl" aria-hidden />

			<div className="relative flex items-center gap-4">
				<div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24">
					<span className="wait-ring absolute inset-1 rounded-full border-2 border-amber-300/70" aria-hidden />
					<span className="wait-ring absolute inset-1 rounded-full border-2 border-amber-300/70" style={{ animationDelay: "1.2s" }} aria-hidden />
					<PrintyMascot className="relative w-full h-full" />
				</div>
				<div className="min-w-0">
					<p className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
						<span className="relative flex w-2 h-2">
							<span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-60" />
							<span className="relative w-2 h-2 rounded-full bg-emerald-500" />
						</span>
						Live · updates on its own
					</p>
					<h2 className="mt-1.5 text-lg sm:text-xl font-black leading-tight text-gray-900 dark:text-white">{title}</h2>
					<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
						Sent {ago(elapsed)} · {timing}
					</p>
				</div>
			</div>

			{/* Progress: already a quarter done the moment it's sent */}
			<div className="relative mt-5">
				<div className="h-2 rounded-full bg-amber-100 dark:bg-white/5 overflow-hidden">
					<div className="wait-bar relative h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-[width] duration-1000 ease-out" style={{ width: `${progress}%` }} />
				</div>
				<div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
					<span>{lastChecked ? `Checked ${ago(now - lastChecked)}` : "Checking…"}</span>
					<span>{late ? "Still on it" : "On track"}</span>
				</div>
			</div>

			<ol className="relative mt-4 space-y-0">
				{steps.map((s, i) => (
					<li key={s.label} className="relative flex gap-3 pb-3 last:pb-0">
						{i < steps.length - 1 && (
							<span className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${s.state === "done" ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-800"}`} aria-hidden />
						)}
						<span
							className={`relative z-[1] w-6 h-6 shrink-0 rounded-full flex items-center justify-center ${
								s.state === "done"
									? "bg-emerald-500 text-white"
									: s.state === "active"
										? "bg-[#fbbf24] text-black ring-4 ring-amber-300/30"
										: "bg-white dark:bg-[#222] border-2 border-gray-200 dark:border-gray-700"
							}`}
						>
							{s.state === "done" ? (
								<Check size={13} weight="bold" />
							) : s.state === "active" ? (
								<span className="flex gap-0.5">
									{[0, 1, 2].map((d) => (
										<span key={d} className="chat-dot w-1 h-1 rounded-full bg-black" style={{ animationDelay: `${d * 0.15}s` }} />
									))}
								</span>
							) : null}
						</span>
						<span className="flex-1 min-w-0 flex items-baseline justify-between gap-3 pt-0.5">
							<span
								className={`text-sm ${
									s.state === "active" ? "font-bold text-gray-900 dark:text-white" : s.state === "done" ? "font-semibold text-gray-700 dark:text-gray-300" : "text-gray-500"
								}`}
							>
								{s.label}
							</span>
							{s.note && (
								<span className={`shrink-0 text-[11px] font-semibold ${s.state === "active" ? "text-[#d97706]" : "text-gray-400"}`}>{s.note}</span>
							)}
						</span>
					</li>
				))}
			</ol>

			<div className="relative mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
				<p className="flex items-center gap-2 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
					<SignOut size={15} className="shrink-0 text-[#d97706]" /> You can leave — it's saved in My orders
				</p>
				<p className="flex items-center gap-2 rounded-xl bg-white/70 dark:bg-white/[0.03] border border-gray-100 dark:border-gray-800 px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
					<ShieldCheck size={15} className="shrink-0 text-emerald-500" /> {kind === "quote" ? "Nothing is charged until you accept" : kind === "confirm" ? "You only pay once it's confirmed" : "Paid — the ready-by time shows here"}
				</p>
			</div>

			<div className="relative mt-3 flex flex-wrap gap-2">
				<AlertsButton />
				{onAddDetails && (
					<button
						type="button"
						onClick={onAddDetails}
						className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:border-[#fbbf24]"
					>
						<ChatCircleText size={15} /> Add details while you wait
					</button>
				)}
			</div>
		</section>
	);
};

/** The moment the wait ends: shown big, once, when it happens on screen */
export const ArrivedBanner = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
	<section className="chat-in relative overflow-hidden rounded-3xl bg-gray-900 dark:bg-[#1a1a1a] dark:ring-1 dark:ring-amber-400/30 p-5 sm:p-6 mb-5 text-white shadow-[0_20px_50px_-20px_rgba(251,191,36,0.6)]" role="status">
		<span className="pointer-events-none absolute -top-16 -right-10 w-56 h-56 rounded-full bg-amber-400/30 blur-3xl" aria-hidden />
		{[12, 30, 52, 70, 86].map((x, i) => (
			<span key={x} className="arrive-spark absolute top-3 w-1.5 h-1.5 rounded-full bg-amber-300" style={{ left: `${x}%`, animationDelay: `${i * 0.12}s` }} aria-hidden />
		))}
		<div className="relative flex items-center gap-4">
			<span className="arrive-pop w-12 h-12 shrink-0 rounded-full bg-[#fbbf24] text-black flex items-center justify-center">
				<Check size={24} weight="bold" />
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-lg font-black leading-tight">{title}</p>
				<p className="text-sm text-gray-300">{text}</p>
			</div>
		</div>
		{action && <div className="relative mt-4">{action}</div>}
	</section>
);

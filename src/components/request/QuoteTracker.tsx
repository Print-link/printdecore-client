import { useEffect, useState, type ReactNode } from "react";
import { Check, ChatCircleText } from "@phosphor-icons/react";
import { PrintyAvatar } from "../assistant/PrintyAvatar";
import { Button } from "../ui";
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
		<section className="mb-6 rounded-xl border border-line bg-surface p-4" aria-live="polite">
			<div className="flex items-start gap-3">
				<span className="w-12 h-12 shrink-0 rounded-xl bg-fill flex items-center justify-center">
					<PrintyAvatar size={34} busy />
				</span>
				<div className="min-w-0">
					<p className="flex items-center gap-1.5 text-xs font-semibold text-ok">
						<span className="w-1.5 h-1.5 rounded-full bg-ok" /> Live
					</p>
					<h2 className="mt-0.5 text-lg font-bold title-tight text-ink">{title}</h2>
					<p className="mt-0.5 text-sm text-ink-2">
						Sent {ago(elapsed)} · {timing}
					</p>
				</div>
			</div>

			{/* Progress: already a quarter done the moment it's sent */}
			<div className="mt-4">
				<div className="h-1 rounded-full bg-fill-press overflow-hidden">
					<div className="h-full rounded-full bg-brand transition-[width] duration-1000 ease-out" style={{ width: `${progress}%` }} />
				</div>
				<div className="num mt-1.5 flex justify-between text-xs text-ink-3">
					<span>{lastChecked ? `Checked ${ago(now - lastChecked)}` : "Checking…"}</span>
					<span>{late ? "Still on it" : "On track"}</span>
				</div>
			</div>

			<ol className="mt-4">
				{steps.map((s, i) => (
					<li key={s.label} className="relative flex gap-3 pb-3.5 last:pb-0">
						{i < steps.length - 1 && <span className={`absolute left-[9px] top-5 bottom-0 w-px ${s.state === "done" ? "bg-ok" : "bg-line-strong"}`} aria-hidden />}
						<span
							className={`relative z-[1] w-[19px] h-[19px] shrink-0 rounded-full flex items-center justify-center ${
								s.state === "done" ? "bg-ok text-white" : s.state === "active" ? "bg-brand" : "bg-surface border-[1.5px] border-line-strong"
							}`}
						>
							{s.state === "done" ? <Check size={11} weight="bold" /> : s.state === "active" ? <span className="w-1.5 h-1.5 rounded-full bg-black" /> : null}
						</span>
						<span className="flex-1 min-w-0 flex items-baseline justify-between gap-3">
							<span className={`text-sm ${s.state === "active" ? "font-semibold text-ink" : s.state === "done" ? "text-ink" : "text-ink-3"}`}>{s.label}</span>
							{s.note && <span className={`shrink-0 text-xs ${s.state === "active" ? "font-semibold text-brand-ink" : "text-ink-3"}`}>{s.note}</span>}
						</span>
					</li>
				))}
			</ol>
			<div className="mt-4 flex flex-wrap gap-2">
				<AlertsButton />
				{onAddDetails && (
					<Button variant="secondary" size="sm" onClick={onAddDetails} icon={<ChatCircleText size={15} />}>
						Add details while you wait
					</Button>
				)}
			</div>
		</section>
	);
};

/** The moment the wait ends: shown once, when it happens on screen */
export const ArrivedBanner = ({ title, text, action }: { title: string; text: string; action?: ReactNode }) => (
	<section className="chat-in mb-6 rounded-xl bg-ok-tint p-4" role="status">
		<div className="flex items-center gap-3">
			<span className="arrive-pop w-10 h-10 shrink-0 rounded-full bg-ok text-white flex items-center justify-center">
				<Check size={20} weight="bold" />
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-base font-bold text-ink">{title}</p>
				<p className="text-sm text-ink-2">{text}</p>
			</div>
		</div>
		{action && <div className="mt-3">{action}</div>}
	</section>
);

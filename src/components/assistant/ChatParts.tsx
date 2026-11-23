import { Fragment, useEffect, useState, type ReactNode } from "react";
import {
	ArrowRight,
	ArrowCounterClockwise,
	Check,
	Checks,
	File as FileIcon,
	FileImage,
	FilePdf,
	MagnifyingGlass,
	Receipt,
	ShieldCheck,
	Storefront,
	Tag,
	Truck,
	WarningCircle,
	X,
} from "@phosphor-icons/react";
import type { AgentFile, AgentMessage } from "../../services/printAgentApi";
import { PrintyAvatar } from "./PrintyAvatar";

export type ChatShop = { id: string; name: string; image?: string | null };

/* ─── Header: who you're talking to, and what they do ─── */

export const ChatHeader = ({ shop, busy, actions }: { shop?: ChatShop; busy?: boolean; actions?: ReactNode }) => (
	<div className="flex items-center gap-3 pb-3 border-b border-line">
		<span className="relative shrink-0">
			<span className="w-11 h-11 rounded-xl bg-fill flex items-center justify-center">
				<PrintyAvatar size={34} busy={busy} />
			</span>
			{shop && (
				<span className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg overflow-hidden ring-2 ring-page bg-fill flex items-center justify-center">
					{shop.image ? <img src={shop.image} alt="" className="w-full h-full object-cover" /> : <Storefront size={13} className="text-ink-2" />}
				</span>
			)}
		</span>
		<div className="flex-1 min-w-0">
			<p className="flex items-center gap-1.5 text-base font-bold text-ink leading-tight truncate">
				Printy
				<span className="rounded-md bg-fill px-1.5 py-px text-xs font-semibold text-ink-2">AI</span>
				{shop && <span className="truncate font-semibold text-ink-2 text-sm">for {shop.name}</span>}
			</p>
			<p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-2">
				<span className={`w-1.5 h-1.5 rounded-full ${busy ? "bg-brand animate-pulse" : "bg-ok"}`} />
				<span className="truncate">{busy ? "Typing…" : "Online · replies in seconds"}</span>
			</p>
		</div>
		{actions}
	</div>
);

/* ─── Progress: where the order is ─── */

export const ChatProgress = ({ step, shop }: { step: 0 | 1 | 2; shop?: boolean }) => {
	const steps = ["Describe", "Review", shop ? "Quote requested" : "Sent"];
	return (
		<ol className="mt-3 flex items-center gap-2 px-1" aria-label="Progress">
			{steps.map((label, i) => {
				const done = i < step || (i === 2 && step === 2);
				const current = i === step && !done;
				return (
					<Fragment key={label}>
						<li className="flex items-center gap-1.5 shrink-0" aria-current={current ? "step" : undefined}>
							<span
								className={`num w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
									done ? "bg-ok text-white" : current ? "bg-ink text-page" : "bg-fill-press text-ink-2"
								}`}
							>
								{done ? <Check size={11} weight="bold" /> : i + 1}
							</span>
							<span className={`text-xs font-semibold ${current || done ? "text-ink" : "text-ink-3"}`}>{label}</span>
						</li>
						{i < steps.length - 1 && <li className={`flex-1 h-0.5 rounded ${i < step ? "bg-ok" : "bg-line-strong"}`} aria-hidden />}
					</Fragment>
				);
			})}
		</ol>
	);
};

/* ─── The first screen ─── */

const greeting = () => {
	const h = new Date().getHours();
	return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};

export const ChatWelcome = ({ name, shop, starters, onPick }: { name?: string; shop?: ChatShop; starters: string[]; onPick: (text: string) => void }) => {
	const abilities = shop
		? [
				{ icon: Receipt, title: "Writes your brief", text: "Asks the right questions so nothing is missed" },
				{ icon: Storefront, title: `Sends it to ${shop.name}`, text: "They price it and send you a quote" },
				{ icon: ShieldCheck, title: "No surprise charges", text: "Nothing is charged until you accept" },
			]
		: [
				{ icon: MagnifyingGlass, title: "Finds the product", text: "From what you say, in your own words" },
				{ icon: Tag, title: "Prices it instantly", text: "Real prices from shops near you" },
				{ icon: Truck, title: "Delivery or pickup", text: "You confirm before anything is sent" },
			];
	return (
		<div className="chat-in">
			<div className="flex flex-col items-center text-center pt-4 pb-2">
				<span className="w-16 h-16 rounded-xl bg-fill flex items-center justify-center"><PrintyAvatar size={44} /></span>
				<h2 className="mt-4 text-2xl font-bold title-tight text-ink">
					{greeting()}
					{name ? `, ${name}` : ""}
				</h2>
				<p className="mt-1 max-w-md text-sm text-ink-2">
					{shop
						? `Tell me what you'd like from ${shop.name} — in your own words, or send a design or photo.`
						: "Tell me what you need printed, or send your file. I'll take it from there."}
				</p>
			</div>

			<div className="mt-6 grid grid-cols-3 border-y border-line divide-x divide-line">
				{abilities.map(({ icon: Icon, title, text }) => (
					<div key={title} className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 p-3">
						<span className="w-8 h-8 shrink-0 rounded-lg bg-fill text-ink flex items-center justify-center">
							<Icon size={17} weight="regular" />
						</span>
						<span>
							<span className="block text-xs sm:text-sm font-bold leading-tight text-ink">{title}</span>
							<span className="hidden sm:block mt-0.5 text-xs text-ink-2">{text}</span>
						</span>
					</div>
				))}
			</div>

			<p className="mt-6 mb-1 text-lg font-bold title-tight text-ink">Try asking</p>
			<div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-6 border-t border-line sm:border-0">
				{starters.map((s) => (
					<button
						key={s}
						type="button"
						onClick={() => onPick(s)}
						className="tap group flex items-center justify-between gap-3 min-h-12 py-3 border-b border-line text-left text-base text-ink"
					>
						{s}
						<ArrowRight size={14} className="shrink-0 text-ink-3" />
					</button>
				))}
			</div>
		</div>
	);
};

/* ─── Messages ─── */

const time = (at: string) => {
	const d = new Date(at);
	return isNaN(d.getTime()) ? "" : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
};

const dayLabel = (at: string) => {
	const d = new Date(at);
	if (isNaN(d.getTime())) return "";
	const today = new Date();
	const yesterday = new Date(Date.now() - 864e5);
	if (d.toDateString() === today.toDateString()) return "Today";
	if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
	return d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
};

export const DaySeparator = ({ at }: { at: string }) => (
	<div className="flex items-center gap-3 py-1" role="separator">
		<span className="flex-1 h-px bg-line" />
		<span className="text-xs font-semibold text-ink-3">{dayLabel(at)}</span>
		<span className="flex-1 h-px bg-line" />
	</div>
);

const fileIcon = (f: AgentFile) => (f.type?.startsWith("image/") ? FileImage : /pdf/i.test(f.type ?? f.name) ? FilePdf : FileIcon);
const fileSize = (n?: number) => (n ? (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`) : "");

export const FileTile = ({ file, onRemove, tone = "light" }: { file: AgentFile; onRemove?: () => void; tone?: "light" | "onAmber" }) => {
	const Icon = fileIcon(file);
	const image = file.type?.startsWith("image/");
	const body = (
		<>
			{image ? (
				<img src={file.url} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0 bg-fill" />
			) : (
				<span className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center ${tone === "onAmber" ? "bg-black/10" : "bg-fill text-ink-2"}`}>
					<Icon size={18} weight="regular" />
				</span>
			)}
			<span className="min-w-0 text-left">
				<span className="block truncate text-xs font-semibold">{file.name}</span>
				{file.size ? <span className={`block text-xs ${tone === "onAmber" ? "text-black/60" : "text-ink-2"}`}>{fileSize(file.size)}</span> : null}
			</span>
		</>
	);
	const cls = `flex items-center gap-2 p-1.5 pr-2.5 rounded-xl max-w-[15rem] ${
		tone === "onAmber" ? "bg-black/[0.08] text-black" : "bg-white dark:bg-[#111] border border-line text-ink"
	}`;
	if (onRemove) {
		return (
			<span className={cls}>
				{body}
				<button type="button" onClick={onRemove} className="tap ml-1 p-1 rounded-md text-ink-3 hover:text-bad" aria-label={`Remove ${file.name}`}>
					<X size={12} weight="bold" />
				</button>
			</span>
		);
	}
	return (
		<a href={file.url} target="_blank" rel="noreferrer" className={`${cls} hover:opacity-90`}>
			{body}
		</a>
	);
};

/**
 * One message. Messages in a row from the same side are grouped: the avatar
 * and name show once, the time under the last one.
 */
export const MessageRow = ({
	message,
	first,
	last,
	status,
	onRetry,
	onDiscard,
}: {
	message: AgentMessage;
	first: boolean;
	last: boolean;
	/** The customer's message that's sending, or didn't go through */
	status?: "sending" | "failed";
	onRetry?: () => void;
	onDiscard?: () => void;
}) => {
	const mine = message.role === "customer";
	const files = mine ? message.attachments : [];
	return (
		<div className={`chat-in flex gap-2.5 ${mine ? "justify-end" : "justify-start"} ${first ? "mt-4" : "mt-1"}`}>
			{!mine && <span className="w-8 shrink-0">{first && <PrintyAvatar size={32} />}</span>}
			<div className={`flex flex-col max-w-[85%] sm:max-w-[75%] ${mine ? "items-end" : "items-start"}`}>
				{first && !mine && <span className="mb-1 ml-1 text-xs font-semibold text-ink-2">Printy</span>}
				{message.text && (
					<div
						className={`px-3.5 py-2.5 text-[15px] leading-snug rounded-2xl ${
							mine
								? `bg-brand text-black ${last ? "rounded-br-md" : ""} ${status === "failed" ? "opacity-60" : ""}`
								: `bg-fill text-ink ${last ? "rounded-bl-md" : ""}`
						}`}
					>
						<FormattedText text={message.text} />
					</div>
				)}
				{files.length > 0 && (
					<div className={`flex flex-wrap gap-1.5 ${message.text ? "mt-1.5" : ""} ${mine ? "justify-end" : ""}`}>
						{files.map((f) => (
							<FileTile key={f.url} file={f} />
						))}
					</div>
				)}
				{status === "failed" ? (
					<span className="mt-1 flex items-center gap-2 text-xs font-semibold text-bad">
						<WarningCircle size={13} weight="fill" /> Not sent
						<button type="button" onClick={onRetry} className="inline-flex items-center gap-1 text-ink hover:text-ink">
							<ArrowCounterClockwise size={12} weight="bold" /> Retry
						</button>
						<button type="button" onClick={onDiscard} className="text-ink-2 hover:text-bad">
							Discard
						</button>
					</span>
				) : (
					last && (
						<span className={`mt-1 flex items-center gap-1 text-xs text-ink-3 ${mine ? "mr-1" : "ml-1"}`}>
							{status === "sending" ? "Sending…" : time(message.at)}
							{mine && status !== "sending" && <Checks size={13} weight="bold" className="text-ok" aria-label="Delivered" />}
						</span>
					)
				)}
			</div>
		</div>
	);
};

const THINKING = ["Reading your message", "Finding the right product", "Checking the details", "Working out the price"];

/** Printy is working: dots, and what it's doing in words */
export const TypingIndicator = ({ shop }: { shop?: boolean }) => {
	const lines = shop ? ["Reading your message", "Writing up your brief", "Checking the details"] : THINKING;
	const [i, setI] = useState(0);
	useEffect(() => {
		const id = window.setInterval(() => setI((n) => Math.min(n + 1, lines.length - 1)), 1800);
		return () => window.clearInterval(id);
	}, [lines.length]);
	return (
		<div className="chat-in mt-4 flex items-end gap-2.5" aria-live="polite">
			<PrintyAvatar size={32} busy />
			<div className="flex flex-col items-start">
				<span className="mb-1 ml-1 text-xs font-semibold text-ink-2">Printy</span>
				<div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md bg-fill px-4 py-3">
					<span className="flex gap-1">
						{[0, 1, 2].map((d) => (
							<span key={d} className="chat-dot w-1.5 h-1.5 rounded-full bg-ink-2" style={{ animationDelay: `${d * 0.15}s` }} />
						))}
					</span>
					<span key={i} className="chat-in text-xs text-ink-2">
						{lines[i]}…
					</span>
				</div>
			</div>
		</div>
	);
};

/** The assistant writes light formatting: **bold**, line breaks and "- " lists. Rendered as text, never as HTML. */
export const FormattedText = ({ text }: { text: string }) => {
	const inline = (line: string): ReactNode[] =>
		line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
			part.startsWith("**") && part.endsWith("**") && part.length > 4 ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>
		);

	const blocks: ReactNode[] = [];
	let list: string[] = [];
	const flush = () => {
		if (list.length) {
			const items = list;
			blocks.push(
				<ul key={`l${blocks.length}`} className="list-disc pl-5 space-y-0.5 marker:text-ink-3">
					{items.map((item, i) => (
						<li key={i}>{inline(item)}</li>
					))}
				</ul>
			);
			list = [];
		}
	};
	for (const raw of text.split("\n")) {
		const line = raw.trimEnd();
		const item = line.match(/^\s*[-•*]\s+(.*)$/);
		if (item) {
			list.push(item[1]);
			continue;
		}
		flush();
		if (line.trim()) blocks.push(<p key={`p${blocks.length}`}>{inline(line)}</p>);
	}
	flush();
	return <div className="space-y-1.5 break-words">{blocks}</div>;
};

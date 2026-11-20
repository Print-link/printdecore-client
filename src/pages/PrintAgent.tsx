import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChatCircleText, CheckCircle, FileText, NotePencil, PaperPlaneRight, Paperclip, SpinnerGap, Sparkle, UserCircle, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { PageHeader } from "../components/common/PageHeader";
import { DeliveryChoice } from "../components/order/DeliveryChoice";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { useMarketplaceVendor } from "../hooks/useMarketplace";
import { deliveryReady, type Delivery, type FileInfo } from "../services/orderApi";
import { money } from "../services/pricingApi";
import {
	confirmAgentDraft,
	getAgentConversation,
	MAX_AGENT_FILE_BYTES,
	MAX_AGENT_FILES,
	sendAgentMessage,
	startAgentConversation,
	uploadPrintFiles,
	type AgentConversation,
	type AgentDraft,
	type AgentFile,
	type AgentMessage,
} from "../services/printAgentApi";

// The conversation in progress, so a reload or a trip to sign in picks it up
// again — one for the Printdecore-wide assistant, one per shop
const STORAGE_KEY = "printdecore_agent_conversation";
const storageKey = (shopId?: string) => (shopId ? `${STORAGE_KEY}:shop:${shopId}` : STORAGE_KEY);
const readSaved = (shopId?: string) => {
	try {
		return localStorage.getItem(storageKey(shopId));
	} catch {
		return null;
	}
};
const writeSaved = (shopId: string | undefined, id: string | null) => {
	try {
		if (id) localStorage.setItem(storageKey(shopId), id);
		else localStorage.removeItem(storageKey(shopId));
	} catch {
		// Storage blocked: the chat still works for this visit
	}
};

const STARTERS = ["Business cards for my shop", "Print my document", "A banner for an event", "Wedding invitations"];
const SHOP_STARTERS = ["Branded bags or packaging", "Custom mugs or T-shirts", "A large banner or sign", "Something else I need printed"];

/** The shop a chat works for: its requests go to it for a quote */
type ChatShop = { id: string; name: string };
const FORM_PATH = "/home/print-assistant/form";

/**
 * The Print Assistant as a conversation: the customer describes the job in
 * their own words, the assistant finds the product, asks what it needs,
 * prices it and puts the order together. Nothing is sent until the customer
 * taps Confirm on the order card.
 */
export const PrintAgent = () => (
	<AssistantPage title="Print Assistant" subtitle="Tell me what you need printed — I'll price it and put the order together" />
);

/**
 * The assistant on a shop's page, for what the shop doesn't list: the
 * customer describes it, the assistant puts the request together, and the
 * shop sends a quote.
 */
export const ShopAssistant = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: shop, isLoading, error } = useMarketplaceVendor(id);

	if (isLoading) return <SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />;
	if (error || !shop) {
		return (
			<div className="max-w-2xl mx-auto">
				<PageHeader title="Ask a shop" />
				<p className="font-semibold text-gray-900 dark:text-white">This shop isn't taking requests right now</p>
				<button type="button" onClick={() => navigate("/home/shops")} className="mt-3 text-sm font-semibold text-[#d97706]">
					See other shops
				</button>
			</div>
		);
	}
	return <AssistantPage title={`Ask ${shop.name}`} subtitle={`Describe what you need — ${shop.name} will send you a price`} shop={{ id: shop.id, name: shop.name }} />;
};

const AssistantPage = ({ title, subtitle, shop }: { title: string; subtitle: string; shop?: ChatShop }) => {
	const { user } = useAuth();
	const { pathname } = useLocation();

	return (
		<div className="w-full max-w-2xl mx-auto flex flex-col">
			<PageHeader title={title} subtitle={subtitle} />
			{user ? (
				<AgentChat key={shop?.id ?? "printdecore"} shop={shop} />
			) : (
				<div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] p-6 text-center">
					<ChatCircleText size={36} className="mx-auto text-[#fbbf24]" />
					<p className="mt-3 font-bold text-gray-900 dark:text-white">Sign in to chat with the assistant</p>
					<p className="mt-1 text-sm text-gray-500">
						{shop
							? `Describe what you need and it puts your request together for ${shop.name} to price.`
							: "It finds the right product, prices your job and puts the order together for you."}
					</p>
					<Link
						to={`/login?returnUrl=${encodeURIComponent(pathname)}`}
						className="mt-4 inline-block px-5 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl"
					>
						Sign in
					</Link>
					{!shop && (
						<p className="mt-4 text-sm text-gray-500">
							Or{" "}
							<Link to={FORM_PATH} className="text-[#d97706] font-semibold hover:underline">
								fill in the request form
							</Link>{" "}
							without signing in first.
						</p>
					)}
				</div>
			)}
		</div>
	);
};

type Pending = { text: string; attachments: AgentFile[] };

const AgentChat = ({ shop }: { shop?: ChatShop }) => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();
	const shopId = shop?.id;
	const [conversation, setConversation] = useState<AgentConversation | null>(null);
	const [loading, setLoading] = useState(() => !!readSaved(shopId));
	const [pending, setPending] = useState<Pending | null>(null);
	const [waitingForStaff, setWaitingForStaff] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const bottom = useRef<HTMLDivElement>(null);

	// Pick up the conversation in progress, if there is one
	useEffect(() => {
		const saved = readSaved(shopId);
		if (!saved) return;
		getAgentConversation(saved)
			.then((c) => {
				// Only this page's chat: the shop's own, or the Printdecore-wide one
				if (c.status === "closed" || (c.branchId ?? undefined) !== shopId) writeSaved(shopId, null);
				else {
					setConversation(c);
					setWaitingForStaff(c.status === "needs_staff");
				}
			})
			.catch(() => writeSaved(shopId, null))
			.finally(() => setLoading(false));
	}, [shopId]);

	useEffect(() => {
		bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" });
	}, [conversation?.messages.length, pending, conversation?.draft?.version]);

	const send = async (text: string, files: FileInfo[]) => {
		if (pending) return;
		setError(null);
		setPending({ text, attachments: files });
		try {
			const coords = userLocation ?? undefined;
			const current = conversation ?? (await startAgentConversation(coords, shopId));
			if (!conversation) {
				setConversation(current);
				writeSaved(shopId, current.id);
			}
			const result = await sendAgentMessage(current.id, { text, attachments: files, coords });
			setConversation(result.conversation);
			setWaitingForStaff(result.waitingForStaff);
			return true;
		} catch (err) {
			setError(err instanceof Error ? err.message : "The assistant didn't answer");
			return false;
		} finally {
			setPending(null);
		}
	};

	const startOver = () => {
		if (conversation?.messages.length && !window.confirm("Start a new conversation? This one stays in your history.")) return;
		writeSaved(shopId, null);
		setConversation(null);
		setWaitingForStaff(false);
		setError(null);
	};

	const draft = conversation?.draft;
	const openDraft = draft && !draft.printRequestId ? draft : null;
	const messages = conversation?.messages ?? [];

	if (loading) {
		return (
			<div className="py-16 flex justify-center">
				<SpinnerGap size={22} className="animate-spin text-[#fbbf24]" />
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4 pb-4">
				{!messages.length && !pending && (
					<div className="rounded-2xl bg-amber-50 dark:bg-amber-900/10 p-5">
						<p className="font-bold text-gray-900 dark:text-white">
							Hi{user?.firstName ? ` ${user.firstName}` : ""} — what would you like printed?
						</p>
						<p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
							{shop
								? `Didn't see it in ${shop.name}'s list? Describe it in your own words, or attach a design or photo. I'll put your request together and ${shop.name} will send you a price.`
								: "Describe it in your own words, or attach your file. I'll find the right product, check your artwork and price it for you."}
						</p>
						<div className="mt-4 flex flex-wrap gap-2">
							{(shop ? SHOP_STARTERS : STARTERS).map((s) => (
								<button
									key={s}
									type="button"
									onClick={() => send(s, [])}
									className="px-3 py-1.5 text-sm rounded-full bg-white dark:bg-[#1e1e1e] border border-amber-200 dark:border-amber-900/40 text-gray-800 dark:text-gray-200 hover:border-[#fbbf24]"
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}

				{messages.map((m, i) => (
					<MessageBubble key={`${m.at}-${i}`} message={m} />
				))}
				{pending && (
					<>
						<MessageBubble message={{ role: "customer", text: pending.text, attachments: pending.attachments, at: "" }} />
						<div className="flex items-center gap-2 text-sm text-gray-500" aria-live="polite">
							<SpinnerGap size={16} className="animate-spin text-[#fbbf24]" />
							Thinking…
						</div>
					</>
				)}

				{openDraft && conversation && (
					<DraftCard
						key={openDraft.version}
						draft={openDraft}
						phone={user?.phoneNumber}
						shopName={shop?.name}
						onConfirm={async (delivery, files) => {
							try {
								const result = await confirmAgentDraft(conversation.id, openDraft.version, delivery, files);
								setConversation(result.conversation);
								writeSaved(shopId, null);
								toast.success(
									result.instantPrice
										? "Order sent — the shop is confirming it"
										: shop
											? `Request sent — ${shop.name} will send you a price`
											: "Request sent — we're preparing your quote"
								);
								navigate(`/home/print-request/${result.printRequest.id}`);
							} catch (err) {
								toast.error(err instanceof Error ? err.message : "Couldn't send your order");
								// The draft may have changed: show the latest
								getAgentConversation(conversation.id).then(setConversation).catch(() => {});
							}
						}}
					/>
				)}

				{conversation?.printRequestId && !openDraft && (
					<div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-900/10 p-4 text-sm">
						<CheckCircle size={20} weight="fill" className="text-green-600 shrink-0" />
						<span className="flex-1 text-gray-800 dark:text-gray-200">{shop ? `Your request was sent to ${shop.name}.` : "Your order was sent."}</span>
						<Link to={`/home/print-request/${conversation.printRequestId}`} className="font-semibold text-[#d97706] hover:underline">
							View it
						</Link>
					</div>
				)}

				{waitingForStaff && (
					<div className="flex items-start gap-3 rounded-xl bg-blue-50 dark:bg-blue-900/10 p-4 text-sm text-gray-800 dark:text-gray-200">
						<UserCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
						<span>We've passed this to the Printdecore team. Someone will get back to you shortly — you can keep adding details here.</span>
					</div>
				)}

				{error && <p className="text-sm text-red-500">{error}</p>}
				<div ref={bottom} />
			</div>

			{conversation?.status === "closed" ? (
				<div className="rounded-xl bg-gray-100 dark:bg-[#1e1e1e] p-4 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3">
					<span>This chat is closed.</span>
					<button type="button" onClick={startOver} className="font-semibold text-[#d97706] hover:underline">
						Start a new chat
					</button>
				</div>
			) : (
				<Composer disabled={!!pending} onSend={send} />
			)}

			<div className="mt-3 flex items-center justify-between text-xs text-gray-500">
				{shop ? (
					<Link to={`/home/shops/${shop.id}`} className="hover:text-[#d97706]">
						Back to {shop.name}
					</Link>
				) : (
					<Link to={FORM_PATH} className="flex items-center gap-1 hover:text-[#d97706]">
						<NotePencil size={14} />
						Use the form instead
					</Link>
				)}
				{conversation && (
					<button type="button" onClick={startOver} className="hover:text-[#d97706]">
						Start a new chat
					</button>
				)}
			</div>
		</>
	);
};

const MessageBubble = ({ message }: { message: AgentMessage }) => {
	const mine = message.role === "customer";
	return (
		<div className={`flex gap-2 ${mine ? "justify-end" : "justify-start"}`}>
			{!mine && (
				<span className="mt-1 w-7 h-7 shrink-0 rounded-full bg-[#fbbf24] flex items-center justify-center" aria-hidden>
					<Sparkle size={14} weight="fill" className="text-black" />
				</span>
			)}
			<div
				className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
					mine ? "bg-[#fbbf24] text-black rounded-br-md" : "bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-md"
				}`}
			>
				{message.text && <FormattedText text={message.text} />}
				{mine && message.attachments.length > 0 && (
					<div className={`flex flex-wrap gap-1.5 ${message.text ? "mt-2" : ""}`}>
						{message.attachments.map((f) => (
							<a
								key={f.url}
								href={f.url}
								target="_blank"
								rel="noreferrer"
								className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/10 text-xs font-medium max-w-[12rem]"
							>
								<FileText size={12} className="shrink-0" />
								<span className="truncate">{f.name}</span>
							</a>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

/** The assistant writes light formatting: **bold**, line breaks and "- " lists. Rendered as text, never as HTML. */
const FormattedText = ({ text }: { text: string }) => {
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
				<ul key={`l${blocks.length}`} className="list-disc pl-5 space-y-0.5">
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
	return <div className="space-y-1.5">{blocks}</div>;
};

const Composer = ({ disabled, onSend }: { disabled: boolean; onSend: (text: string, files: FileInfo[]) => Promise<boolean | undefined> }) => {
	const [text, setText] = useState("");
	const [files, setFiles] = useState<FileInfo[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	const attach = async (list: FileList | null) => {
		const all = Array.from(list ?? []);
		const tooBig = all.filter((f) => f.size > MAX_AGENT_FILE_BYTES);
		if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} ${tooBig.length === 1 ? "is" : "are"} over 25MB — send a smaller copy or a ZIP`);
		const room = MAX_AGENT_FILES - files.length;
		const fitting = all.filter((f) => f.size <= MAX_AGENT_FILE_BYTES);
		if (fitting.length > room) toast.info(`Up to ${MAX_AGENT_FILES} files per message — send the rest in your next message`);
		const picked = fitting.slice(0, room);
		if (!picked.length) {
			if (fileInput.current) fileInput.current.value = "";
			return;
		}
		setUploading(true);
		try {
			const res = await uploadPrintFiles(picked);
			if (!res.success || !res.data?.length) throw new Error(res.message || "Upload failed");
			setFiles((f) => [...f, ...res.data!]);
			if ((res as { failed?: string[] }).failed?.length) toast.warning(res.message);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't upload your file");
		} finally {
			setUploading(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	};

	const submit = async () => {
		const message = text.trim();
		if ((!message && !files.length) || disabled || uploading) return;
		const sentText = text;
		const sentFiles = files;
		setText("");
		setFiles([]);
		const ok = await onSend(message, sentFiles);
		// Didn't go through: give them their message back
		if (ok === false) {
			setText(sentText);
			setFiles(sentFiles);
		}
	};

	return (
		<div className="sticky bottom-0 bg-gray-50 dark:bg-[#111111] pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
			{files.length > 0 && (
				<div className="flex flex-wrap gap-1.5 mb-2">
					{files.map((f) => (
						<span key={f.url} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-xs max-w-[14rem]">
							<FileText size={12} className="shrink-0 text-[#d97706]" />
							<span className="truncate text-gray-800 dark:text-gray-200">{f.name}</span>
							<button type="button" onClick={() => setFiles((all) => all.filter((x) => x.url !== f.url))} className="p-0.5 text-gray-400 hover:text-red-500" aria-label={`Remove ${f.name}`}>
								<X size={12} />
							</button>
						</span>
					))}
				</div>
			)}
			<div className="flex items-end gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] p-2 focus-within:ring-2 focus-within:ring-[#fbbf24]/50">
				<button
					type="button"
					onClick={() => fileInput.current?.click()}
					disabled={uploading || files.length >= MAX_AGENT_FILES}
					className="p-2 rounded-xl text-gray-500 hover:text-[#d97706] hover:bg-amber-50 dark:hover:bg-amber-900/10 disabled:opacity-50"
					aria-label="Attach files"
					title="Attach files — any format, up to 10"
				>
					{uploading ? <SpinnerGap size={18} className="animate-spin" /> : <Paperclip size={18} />}
				</button>
				<input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => attach(e.target.files)} />
				<textarea
					value={text}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
							e.preventDefault();
							submit();
						}
					}}
					rows={1}
					maxLength={4000}
					placeholder="Describe what you need printed…"
					aria-label="Message the Print Assistant"
					className="flex-1 resize-none max-h-40 py-2 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none field-sizing-content"
				/>
				<button
					type="button"
					onClick={submit}
					disabled={disabled || uploading || (!text.trim() && !files.length)}
					className="p-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black disabled:opacity-40"
					aria-label="Send"
				>
					<PaperPlaneRight size={18} weight="fill" />
				</button>
			</div>
		</div>
	);
};

/** The order the assistant put together: review it, settle delivery, and send it */
const DraftCard = ({
	draft,
	phone,
	shopName,
	onConfirm,
}: {
	draft: AgentDraft;
	phone?: string;
	/** Set on a shop's page: the request goes to this shop */
	shopName?: string;
	onConfirm: (delivery: Delivery, files: FileInfo[]) => Promise<void>;
}) => {
	// The exact spot is picked on the map here; the assistant only has it in words
	const [delivery, setDelivery] = useState<Delivery | null>(() => ({
		fulfilment: draft.fulfilment?.type ?? "delivery",
		recipientPhone: draft.fulfilment?.recipientPhone ?? phone,
	}));
	const spokenAddress = draft.fulfilment?.type === "delivery" ? draft.fulfilment.address : undefined;
	const [sending, setSending] = useState(false);
	// The file the shop needs, attached right here if it isn't in the chat yet
	const [cardFiles, setCardFiles] = useState<FileInfo[]>([]);
	const [uploading, setUploading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	const needsFile = !!draft.fileRequired && draft.attachments.length === 0 && cardFiles.length === 0;
	const ready = deliveryReady(delivery) && !needsFile;

	const attach = async (list: FileList | null) => {
		const picked = Array.from(list ?? []).filter((f) => f.size <= MAX_AGENT_FILE_BYTES).slice(0, MAX_AGENT_FILES - cardFiles.length);
		if (list && picked.length < list.length) toast.error(`Files must be under 25MB, up to ${MAX_AGENT_FILES} at a time`);
		if (!picked.length) return;
		setUploading(true);
		try {
			const res = await uploadPrintFiles(picked);
			if (!res.success || !res.data?.length) throw new Error(res.message || "Upload failed");
			setCardFiles((f) => [...f, ...res.data!]);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't upload your file");
		} finally {
			setUploading(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	};

	return (
		<section className="rounded-2xl border-2 border-[#fbbf24] bg-white dark:bg-[#1e1e1e] p-5" aria-label="Your order">
			<p className="text-[11px] font-bold text-[#d97706] uppercase tracking-widest">{shopName ? `Request for ${shopName} — ready to review` : draft.custom ? "Custom request — ready to review" : "Your order — ready to review"}</p>
			<h2 className="mt-1 font-bold text-gray-900 dark:text-white">
				{draft.quantity.toLocaleString()} × {draft.serviceName}
			</h2>
			{draft.summary.length > 0 && (
				<ul className="mt-2 space-y-1 text-sm text-gray-700 dark:text-gray-300">
					{draft.summary.map((line, i) => (
						<li key={i} className="flex gap-2">
							<CheckCircle size={16} className="text-green-600 shrink-0 mt-0.5" />
							<span>{line}</span>
						</li>
					))}
				</ul>
			)}
			{draft.attachments.length + cardFiles.length > 0 && (
				<p className="mt-2 text-xs text-gray-500">
					Attached: {[...draft.attachments, ...cardFiles].map((a) => a.name).join(", ")}
				</p>
			)}
			{draft.fileRequired && draft.attachments.length === 0 && (
				<div className={`mt-3 rounded-xl border p-3 ${needsFile ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10" : "border-green-200 bg-green-50 dark:border-green-900/40 dark:bg-green-900/10"}`}>
					<p className="text-sm font-semibold text-gray-900 dark:text-white">
						{needsFile ? "Required: " : "Attached: "}
						{draft.fileNeeded ?? "your file"}
					</p>
					<p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">The shop needs it to make your order. Any format, up to 25MB each.</p>
					{cardFiles.length > 0 && (
						<div className="flex flex-wrap gap-1.5 mt-2">
							{cardFiles.map((f) => (
								<span key={f.url} className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-white dark:bg-[#111] text-xs max-w-[14rem]">
									<FileText size={12} className="shrink-0 text-[#d97706]" />
									<span className="truncate text-gray-800 dark:text-gray-200">{f.name}</span>
									<button type="button" onClick={() => setCardFiles((all) => all.filter((x) => x.url !== f.url))} className="p-0.5 text-gray-400 hover:text-red-500" aria-label={`Remove ${f.name}`}>
										<X size={12} />
									</button>
								</span>
							))}
						</div>
					)}
					<button
						type="button"
						onClick={() => fileInput.current?.click()}
						disabled={uploading}
						className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-[#fbbf24] disabled:opacity-50"
					>
						{uploading ? <SpinnerGap size={14} className="animate-spin" /> : <Paperclip size={14} />}
						{cardFiles.length ? "Add more files" : "Attach file"}
					</button>
					<input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => attach(e.target.files)} />
				</div>
			)}
			{!draft.fileRequired && draft.attachments.length === 0 && (
				<p className="mt-2 text-xs text-gray-500">No file needed — if you have a design, logo or reference, you can send it in the chat.</p>
			)}

			<div className="mt-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 p-4">
				<p className="text-sm text-gray-500">{draft.price ? "Your price" : "Price"}</p>
				<p className="text-2xl font-black text-gray-900 dark:text-white">{draft.price ? money(draft.price.total, draft.price.currency) : "Quote on request"}</p>
				<p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
					{draft.price
						? "The shop confirms the price and availability in about 10 minutes, then you pay from your order. Nothing is charged now."
						: shopName
							? `${shopName} reviews your request and sends you a price. Nothing is charged until you accept it.`
							: draft.custom
							? "Our team reviews your request, finds the right shop for it and sends you a price. Nothing is charged until you accept it."
							: "We'll send you a price for this. Nothing is charged until you accept it."}
				</p>
			</div>

			<div className="mt-4">
				<p className="text-sm font-bold text-gray-900 dark:text-white mb-2">Delivery or pickup</p>
				{spokenAddress && delivery?.fulfilment === "delivery" && !delivery.address && (
					<p className="text-xs text-gray-500 mb-2">You mentioned {spokenAddress} — search for the exact place below.</p>
				)}
				<DeliveryChoice delivery={delivery} onChange={setDelivery} />
			</div>

			<button
				type="button"
				disabled={!ready || sending}
				onClick={async () => {
					if (!delivery) return;
					setSending(true);
					await onConfirm(delivery, cardFiles);
					setSending(false);
				}}
				className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{sending && <SpinnerGap size={16} className="animate-spin" />}
				{draft.price ? "Confirm and send" : shopName ? `Send to ${shopName}` : draft.custom ? "Send custom request" : "Confirm and ask for a quote"}
			</button>
			{!ready && (
				<p className="mt-2 text-xs text-center text-gray-500">
					{needsFile
						? `Attach ${(draft.fileNeeded ?? "your file").replace(/^Your /, "your ")} to send it.`
						: `Add a phone number${delivery?.fulfilment === "delivery" ? " and pick the delivery address" : ""} to send it.`}
				</p>
			)}
			<p className="mt-2 text-xs text-center text-gray-500">Want to change something? Just tell the assistant.</p>
		</section>
	);
};

import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
	ArrowDown,
	ArrowLeft,
	CheckCircle,
	CloudArrowUp,
	NotePencil,
	PaperPlaneRight,
	Paperclip,
	PencilSimpleLine,
	Plus,
	ShieldCheck,
	SpinnerGap,
	Storefront,
	UserCircle,
	WarningCircle,
} from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { DeliveryChoice } from "../components/order/DeliveryChoice";
import { ChatHeader, ChatProgress, ChatWelcome, DaySeparator, FileTile, MessageRow, TypingIndicator, type ChatShop } from "../components/assistant/ChatParts";
import { PrintyMascot } from "../components/assistant/PrintyMascot";
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

const FORM_PATH = "/home/print-assistant/form";
const MAX_CHARS = 4000;

/**
 * The Print Assistant as a conversation: the customer describes the job in
 * their own words, the assistant finds the product, asks what it needs,
 * prices it and puts the order together. Nothing is sent until the customer
 * taps Confirm on the order card.
 */
export const PrintAgent = () => <AssistantPage />;

/**
 * The assistant on a shop's page, for what the shop doesn't list: the
 * customer describes it, the assistant puts the request together, and the
 * shop sends a quote.
 */
export const ShopAssistant = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: shop, isLoading, error } = useMarketplaceVendor(id);

	if (isLoading) {
		return (
			<div className="py-16 flex justify-center">
				<SpinnerGap size={22} className="animate-spin text-[#fbbf24]" />
			</div>
		);
	}
	if (error || !shop) {
		return (
			<div className="max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] p-6 text-center">
				<Storefront size={32} className="mx-auto text-gray-400" />
				<p className="mt-2 font-semibold text-gray-900 dark:text-white">This shop isn't taking requests right now</p>
				<button type="button" onClick={() => navigate("/home/shops")} className="mt-3 text-sm font-semibold text-[#d97706]">
					See other shops
				</button>
			</div>
		);
	}
	return <AssistantPage shop={{ id: shop.id, name: shop.name, image: shop.coverImage }} />;
};

const AssistantPage = ({ shop }: { shop?: ChatShop }) => {
	const { user } = useAuth();
	const { pathname } = useLocation();

	return (
		<div className="w-full max-w-3xl mx-auto flex flex-col min-h-[calc(100dvh-10rem)] md:min-h-[calc(100dvh-9rem)]">
			{user ? (
				<AgentChat key={shop?.id ?? "printdecore"} shop={shop} />
			) : (
				<>
					<ChatHeader shop={shop} />
					<div className="mt-4 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1a1a1a] p-6 sm:p-8 text-center">
						<PrintyMascot className="w-28 h-28 mx-auto" />
						<p className="mt-2 text-lg font-black text-gray-900 dark:text-white">Sign in to chat with Printy</p>
						<p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
							{shop
								? `Describe what you need and Printy puts your request together for ${shop.name} to price.`
								: "Printy finds the right product, prices your job and puts the order together for you."}
						</p>
						<Link
							to={`/login?returnUrl=${encodeURIComponent(pathname)}`}
							className="mt-5 inline-block px-6 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl"
						>
							Sign in to continue
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
				</>
			)}
		</div>
	);
};

type Pending = { text: string; attachments: FileInfo[] };

/** A new day starts between these two messages */
const newDay = (prev: AgentMessage | undefined, next: AgentMessage) =>
	!!next.at && (!prev?.at || new Date(prev.at).toDateString() !== new Date(next.at).toDateString());

const AgentChat = ({ shop }: { shop?: ChatShop }) => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();
	const shopId = shop?.id;
	const [conversation, setConversation] = useState<AgentConversation | null>(null);
	const [loading, setLoading] = useState(() => !!readSaved(shopId));
	const [pending, setPending] = useState<Pending | null>(null);
	// A message that didn't go through: shown with Retry, not lost
	const [failed, setFailed] = useState<(Pending & { error: string }) | null>(null);
	const [waitingForStaff, setWaitingForStaff] = useState(false);
	const bottom = useRef<HTMLDivElement>(null);
	const [atBottom, setAtBottom] = useState(true);

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
	}, [conversation?.messages.length, pending, failed, conversation?.draft?.version]);

	// Scrolled up to read: offer a way back down
	useEffect(() => {
		const el = bottom.current;
		if (!el) return;
		const io = new IntersectionObserver(([e]) => setAtBottom(e.isIntersecting), { rootMargin: "0px 0px 160px 0px" });
		io.observe(el);
		return () => {
			io.disconnect();
		};
	}, [loading]);

	const send = async (text: string, files: FileInfo[]) => {
		if (pending) return;
		setFailed(null);
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
		} catch (err) {
			setFailed({ text, attachments: files, error: err instanceof Error ? err.message : "Printy didn't answer" });
		} finally {
			setPending(null);
		}
	};

	const startOver = () => {
		if (conversation?.messages.length && !window.confirm("Start a new conversation? This one stays in your history.")) return;
		writeSaved(shopId, null);
		setConversation(null);
		setWaitingForStaff(false);
		setFailed(null);
	};

	const draft = conversation?.draft;
	const openDraft = draft && !draft.printRequestId ? draft : null;
	const messages = conversation?.messages ?? [];
	const step: 0 | 1 | 2 = conversation?.printRequestId ? 2 : openDraft ? 1 : 0;
	const started = messages.length > 0 || !!pending || !!failed;

	if (loading) {
		return (
			<>
				<ChatHeader shop={shop} />
				<div className="py-16 flex flex-col items-center gap-2 text-sm text-gray-500">
					<SpinnerGap size={22} className="animate-spin text-[#fbbf24]" />
					Loading your conversation…
				</div>
			</>
		);
	}

	const actions = (
		<div className="flex items-center gap-1">
			{shop ? (
				<Link
					to={`/home/shops/${shop.id}`}
					className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<ArrowLeft size={14} /> {shop.name}
				</Link>
			) : (
				<Link
					to={FORM_PATH}
					title="Use the request form instead"
					className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<NotePencil size={16} /> <span className="hidden sm:inline">Use the form</span>
				</Link>
			)}
			{conversation && (
				<button
					type="button"
					onClick={startOver}
					title="Start a new chat"
					className="inline-flex items-center gap-1.5 p-2 sm:px-2.5 rounded-lg text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
				>
					<Plus size={16} weight="bold" /> <span className="hidden sm:inline">New chat</span>
				</button>
			)}
		</div>
	);

	return (
		<>
			<ChatHeader shop={shop} busy={!!pending} actions={actions} />
			{started && <ChatProgress step={step} shop={!!shop} />}

			<div className="flex-1 pb-4" role="log" aria-label="Conversation">
				{!started && <ChatWelcome name={user?.firstName} shop={shop} starters={shop ? SHOP_STARTERS : STARTERS} onPick={(s) => send(s, [])} />}

				{messages.map((m, i) => {
					const prev = messages[i - 1];
					const next = messages[i + 1];
					const day = newDay(prev, m);
					const first = day || prev?.role !== m.role;
					const last = next?.role !== m.role || newDay(m, next) || (!next && !!(pending || failed) && m.role === "customer");
					return (
						<Fragment key={`${m.at}-${i}`}>
							{day && (
								<div className="mt-4">
									<DaySeparator at={m.at} />
								</div>
							)}
							<MessageRow message={m} first={first} last={last} />
						</Fragment>
					);
				})}
				{(pending || failed) && (
					<MessageRow
						message={{ role: "customer", text: (pending ?? failed)!.text, attachments: (pending ?? failed)!.attachments, at: "" }}
						first={messages[messages.length - 1]?.role !== "customer"}
						last
						status={pending ? "sending" : "failed"}
						onRetry={() => failed && send(failed.text, failed.attachments)}
						onDiscard={() => setFailed(null)}
					/>
				)}
				{pending && <TypingIndicator shop={!!shop} />}
				{failed && (
					<p className="mt-2 flex items-center justify-end gap-1.5 text-xs text-red-500" role="alert">
						<WarningCircle size={14} /> {failed.error}
					</p>
				)}

				{openDraft && conversation && (
					<div className="mt-5 chat-in">
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
					</div>
				)}

				{conversation?.printRequestId && !openDraft && (
					<div className="chat-in mt-5 flex items-center gap-3 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-900/10 p-4">
						<span className="w-10 h-10 shrink-0 rounded-full bg-emerald-500 text-white flex items-center justify-center">
							<CheckCircle size={22} weight="fill" />
						</span>
						<span className="flex-1 min-w-0">
							<span className="block text-sm font-bold text-gray-900 dark:text-white">{shop ? `Sent to ${shop.name}` : "Your order was sent"}</span>
							<span className="block text-xs text-gray-600 dark:text-gray-400">You'll get a notification when there's an update.</span>
						</span>
						<Link
							to={`/home/print-request/${conversation.printRequestId}`}
							className="shrink-0 px-3.5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black text-sm font-bold"
						>
							View
						</Link>
					</div>
				)}

				{waitingForStaff && (
					<div className="chat-in mt-5 flex items-start gap-3 rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 p-4 text-sm text-gray-800 dark:text-gray-200">
						<span className="w-9 h-9 shrink-0 rounded-full bg-blue-600 text-white flex items-center justify-center">
							<UserCircle size={20} weight="fill" />
						</span>
						<span>
							<span className="block font-bold text-gray-900 dark:text-white">A person from our team is taking over</span>
							<span className="block text-gray-600 dark:text-gray-400">Someone will get back to you shortly — you can keep adding details here.</span>
						</span>
					</div>
				)}

				<div ref={bottom} className="h-px" />
			</div>

			{conversation?.status === "closed" ? (
				<div className="rounded-2xl bg-gray-100 dark:bg-[#1e1e1e] p-4 text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between gap-3">
					<span>This chat is closed.</span>
					<button type="button" onClick={startOver} className="font-semibold text-[#d97706] hover:underline">
						Start a new chat
					</button>
				</div>
			) : (
				<Composer
					busy={!!pending}
					onSend={send}
					aboveTabBar={!shop}
					shopName={shop?.name}
					jump={!atBottom && started ? () => bottom.current?.scrollIntoView({ behavior: "smooth", block: "end" }) : undefined}
				/>
			)}
		</>
	);
};

const Composer = ({
	busy,
	onSend,
	aboveTabBar,
	shopName,
	jump,
}: {
	busy: boolean;
	onSend: (text: string, files: FileInfo[]) => Promise<void>;
	aboveTabBar: boolean;
	shopName?: string;
	/** Scrolled up: show a button back to the latest message */
	jump?: () => void;
}) => {
	// A quick start ("I need business cards") arrives ready to finish and send
	const prefill = (useLocation().state as { prefill?: string } | null)?.prefill ?? "";
	const [text, setText] = useState(prefill);
	const [files, setFiles] = useState<FileInfo[]>([]);
	const [uploading, setUploading] = useState(0);
	const [dragging, setDragging] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);

	const attach = async (list: FileList | File[] | null) => {
		const all = Array.from(list ?? []);
		const tooBig = all.filter((f) => f.size > MAX_AGENT_FILE_BYTES);
		if (tooBig.length) toast.error(`${tooBig.map((f) => f.name).join(", ")} ${tooBig.length === 1 ? "is" : "are"} over 25MB — send a smaller copy or a ZIP`);
		const room = MAX_AGENT_FILES - files.length;
		const fitting = all.filter((f) => f.size <= MAX_AGENT_FILE_BYTES);
		if (fitting.length > room) toast.info(`Up to ${MAX_AGENT_FILES} files per message — send the rest in your next message`);
		const picked = fitting.slice(0, room);
		if (fileInput.current) fileInput.current.value = "";
		if (!picked.length) return;
		setUploading(picked.length);
		try {
			const res = await uploadPrintFiles(picked);
			if (!res.success || !res.data?.length) throw new Error(res.message || "Upload failed");
			setFiles((f) => [...f, ...res.data!]);
			if ((res as { failed?: string[] }).failed?.length) toast.warning(res.message);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't upload your file");
		} finally {
			setUploading(0);
		}
	};

	// Drop files anywhere on the page
	useEffect(() => {
		let depth = 0;
		const hasFiles = (e: DragEvent) => !!e.dataTransfer?.types.includes("Files");
		const enter = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			depth++;
			setDragging(true);
		};
		const leave = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			depth = Math.max(0, depth - 1);
			if (!depth) setDragging(false);
		};
		const over = (e: DragEvent) => {
			if (hasFiles(e)) e.preventDefault();
		};
		const drop = (e: DragEvent) => {
			if (!hasFiles(e)) return;
			e.preventDefault();
			depth = 0;
			setDragging(false);
			attach(e.dataTransfer?.files ?? null);
		};
		window.addEventListener("dragenter", enter);
		window.addEventListener("dragleave", leave);
		window.addEventListener("dragover", over);
		window.addEventListener("drop", drop);
		return () => {
			window.removeEventListener("dragenter", enter);
			window.removeEventListener("dragleave", leave);
			window.removeEventListener("dragover", over);
			window.removeEventListener("drop", drop);
		};
		// attach reads the latest files through state updates; re-binding each render is fine
	});

	const submit = () => {
		const message = text.trim();
		if ((!message && !files.length) || busy || uploading) return;
		setText("");
		setFiles([]);
		// A message that fails shows in the chat with Retry, so nothing is lost
		onSend(message, files);
	};

	const canSend = !busy && !uploading && (!!text.trim() || files.length > 0);

	return (
		<>
			{dragging && (
				<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-6 pointer-events-none">
					<div className="w-full max-w-md rounded-3xl border-2 border-dashed border-[#fbbf24] bg-white dark:bg-[#1a1a1a] p-8 text-center shadow-2xl">
						<CloudArrowUp size={40} weight="duotone" className="mx-auto text-[#f59e0b]" />
						<p className="mt-2 font-black text-gray-900 dark:text-white">Drop to attach</p>
						<p className="text-sm text-gray-500">Any format, up to 25MB each</p>
					</div>
				</div>
			)}
			<div
				className={`sticky md:bottom-0 z-10 bg-gradient-to-t from-gray-50 via-gray-50 to-gray-50/0 dark:from-[#111111] dark:via-[#111111] dark:to-[#111111]/0 pt-4 md:pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
					// On phones the main Assistant sits above the tab bar; a shop's chat has none
					aboveTabBar ? "bottom-[calc(4rem+env(safe-area-inset-bottom))] pb-2" : "bottom-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
				}`}
			>
				{jump && (
					<button
						type="button"
						onClick={jump}
						className="absolute -top-8 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-white dark:bg-[#2a2a2a] border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 shadow-lg"
					>
						<ArrowDown size={12} weight="bold" /> Latest
					</button>
				)}
				<div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1e1e1e] shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] focus-within:border-[#fbbf24] focus-within:ring-4 focus-within:ring-[#fbbf24]/15 transition-shadow">
					{(files.length > 0 || uploading > 0) && (
						<div className="flex gap-1.5 overflow-x-auto hide-scrollbar px-2.5 pt-2.5">
							{files.map((f) => (
								<FileTile key={f.url} file={f} onRemove={() => setFiles((all) => all.filter((x) => x.url !== f.url))} />
							))}
							{uploading > 0 && (
								<span className="shrink-0 flex items-center gap-2 p-1.5 pr-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-xs text-gray-500">
									<span className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
										<SpinnerGap size={16} className="animate-spin text-[#f59e0b]" />
									</span>
									Uploading {uploading} file{uploading === 1 ? "" : "s"}…
								</span>
							)}
						</div>
					)}
					<textarea
						value={text}
						autoFocus={!!prefill}
						onFocus={(e) => prefill && e.currentTarget.setSelectionRange(e.currentTarget.value.length, e.currentTarget.value.length)}
						onChange={(e) => setText(e.target.value)}
						onPaste={(e) => {
							const pasted = Array.from(e.clipboardData.files);
							if (pasted.length) {
								e.preventDefault();
								attach(pasted);
							}
						}}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
								e.preventDefault();
								submit();
							}
						}}
						rows={1}
						maxLength={MAX_CHARS}
						placeholder={busy ? "Printy is replying…" : shopName ? `Describe what you need from ${shopName}…` : "Describe what you need printed…"}
						aria-label="Message Printy"
						className="chat-input block w-full resize-none max-h-48 min-h-[3rem] px-4 pt-3 pb-1 text-sm bg-transparent text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none field-sizing-content"
					/>
					<div className="flex items-center gap-2 px-2 pb-2">
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							disabled={uploading > 0 || files.length >= MAX_AGENT_FILES}
							className="inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-[#d97706] hover:bg-amber-50 dark:hover:bg-amber-900/10 disabled:opacity-50"
							aria-label="Attach files"
							title="Attach files — any format, up to 10"
						>
							<Paperclip size={17} /> <span className="hidden sm:inline">Attach</span>
						</button>
						<input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => attach(e.target.files)} />
						<span className="flex-1 hidden md:block text-[11px] text-gray-400">
							<kbd className="font-sans font-semibold">Enter</kbd> to send · <kbd className="font-sans font-semibold">Shift + Enter</kbd> for a new line · drop or paste files
						</span>
						<span className="flex-1 md:hidden" />
						{text.length > MAX_CHARS - 500 && (
							<span className={`text-[11px] tabular-nums ${text.length >= MAX_CHARS ? "text-red-500" : "text-gray-400"}`}>
								{text.length}/{MAX_CHARS}
							</span>
						)}
						<button
							type="button"
							onClick={submit}
							disabled={!canSend}
							className="inline-flex items-center gap-1.5 pl-3 pr-3.5 py-2 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-sm font-bold disabled:bg-gray-200 disabled:text-gray-400 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 transition-colors"
							aria-label="Send"
						>
							{busy ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
							<span className="hidden sm:inline">Send</span>
						</button>
					</div>
				</div>
				<p className="mt-1.5 text-center text-[11px] text-gray-400">Printy can make mistakes — you review everything before it's sent.</p>
			</div>
		</>
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
	const allFiles = [...draft.attachments, ...cardFiles];

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

	const label = shopName ? `Request for ${shopName}` : draft.custom ? "Custom request" : "Order summary";

	return (
		<section className="rounded-3xl border border-amber-300/70 dark:border-amber-500/30 bg-white dark:bg-[#1a1a1a] shadow-[0_20px_50px_-24px_rgba(217,119,6,0.45)] overflow-hidden" aria-label="Your order">
			{/* Header */}
			<div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-amber-50 to-white dark:from-amber-400/10 dark:to-transparent border-b border-amber-100 dark:border-amber-500/20">
				<span className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wider text-[#b45309] dark:text-amber-300">{label}</span>
				<span className="ml-auto shrink-0 whitespace-nowrap inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-400/15 px-2 py-0.5 text-[11px] font-bold text-[#b45309] dark:text-amber-300">
					<span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-pulse" /> Ready to review
				</span>
			</div>

			<div className="p-5">
				<h2 className="text-lg font-black text-gray-900 dark:text-white leading-snug">
					<span className="tabular-nums">{draft.quantity.toLocaleString()}</span> × {draft.serviceName}
				</h2>

				{draft.summary.length > 0 && (
					<dl className="mt-3 rounded-2xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
						{draft.summary.map((line, i) => {
							// "Size: A5" reads as a spec row; anything else as a line
							const m = line.match(/^([^:]{1,32}):\s*(.+)$/);
							return m ? (
								<div key={i} className="flex justify-between gap-4 px-3.5 py-2 text-sm">
									<dt className="text-gray-500 dark:text-gray-400">{m[1]}</dt>
									<dd className="text-right font-semibold text-gray-900 dark:text-white">{m[2]}</dd>
								</div>
							) : (
								<div key={i} className="flex gap-2 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-300">
									<CheckCircle size={16} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
									<span>{line}</span>
								</div>
							);
						})}
					</dl>
				)}

				{/* Files */}
				{allFiles.length > 0 && (
					<div className="mt-3">
						<p className="mb-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">Files</p>
						<div className="flex flex-wrap gap-1.5">
							{draft.attachments.map((f) => (
								<FileTile key={f.url} file={f} />
							))}
							{cardFiles.map((f) => (
								<FileTile key={f.url} file={f} onRemove={() => setCardFiles((all) => all.filter((x) => x.url !== f.url))} />
							))}
						</div>
					</div>
				)}
				{draft.fileRequired && draft.attachments.length === 0 && (
					<div className={`mt-3 rounded-2xl border p-3.5 ${needsFile ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10" : "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-900/10"}`}>
						<p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900 dark:text-white">
							{needsFile ? <WarningCircle size={16} weight="fill" className="text-red-500" /> : <CheckCircle size={16} weight="fill" className="text-emerald-500" />}
							{needsFile ? "Required: " : "Attached: "}
							{draft.fileNeeded ?? "your file"}
						</p>
						<p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">The shop needs it to make your order. Any format, up to 25MB each.</p>
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							disabled={uploading}
							className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-[#111] border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-200 hover:border-[#fbbf24] disabled:opacity-50"
						>
							{uploading ? <SpinnerGap size={14} className="animate-spin" /> : <Paperclip size={14} />}
							{cardFiles.length ? "Add more files" : "Attach file"}
						</button>
						<input ref={fileInput} type="file" multiple className="hidden" onChange={(e) => attach(e.target.files)} />
					</div>
				)}
				{!draft.fileRequired && draft.attachments.length === 0 && (
					<p className="mt-3 text-xs text-gray-500">No file needed — if you have a design, logo or reference, you can send it in the chat.</p>
				)}

				{/* Price */}
				<div className="mt-4 rounded-2xl bg-gray-900 dark:bg-black/40 dark:ring-1 dark:ring-gray-800 p-4 text-white">
					<div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
						<div>
							<p className="text-xs text-gray-400">{draft.price ? "Total" : "Price"}</p>
							<p className="text-2xl font-black tabular-nums whitespace-nowrap">{draft.price ? money(draft.price.total, draft.price.currency) : "Quote on request"}</p>
						</div>
						<span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-white/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
							<ShieldCheck size={13} weight="fill" /> Nothing charged now
						</span>
					</div>
					<p className="mt-2 text-xs leading-relaxed text-gray-300">
						{draft.price
							? "The shop confirms the price and availability in about 10 minutes, then you pay from your order."
							: shopName
								? `${shopName} reviews your request and sends you a price. You only pay if you accept it.`
								: draft.custom
									? "Our team reviews your request, finds the right shop for it and sends you a price. You only pay if you accept it."
									: "We'll send you a price for this. You only pay if you accept it."}
					</p>
				</div>

				{/* Delivery */}
				<div className="mt-5">
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
					className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-black rounded-2xl shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
				>
					{sending ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneRight size={16} weight="fill" />}
					{draft.price ? "Confirm and send" : shopName ? `Send to ${shopName}` : draft.custom ? "Send custom request" : "Confirm and ask for a quote"}
				</button>
				{!ready && (
					<p className="mt-2 text-xs text-center text-gray-500">
						{needsFile
							? `Attach ${(draft.fileNeeded ?? "your file").replace(/^Your /, "your ")} to send it.`
							: `Add a phone number${delivery?.fulfilment === "delivery" ? " and pick the delivery address" : ""} to send it.`}
					</p>
				)}
				<p className="mt-2 flex items-center justify-center gap-1 text-xs text-gray-500">
					<PencilSimpleLine size={13} /> Want to change something? Just tell Printy.
				</p>
			</div>
		</section>
	);
};

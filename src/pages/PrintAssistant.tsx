import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowCounterClockwise, CaretRight, ChatCircleText, CheckCircle, FileText, MagnifyingGlass, SpinnerGap, Upload, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { PageHeader } from "../components/common/PageHeader";
import { DeliveryChoice } from "../components/order/DeliveryChoice";
import { ProductLoader } from "../components/order/ProductLoader";
import type { ConfiguredService } from "../components/order/configuredService";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { deliveryReady, getServiceTemplateOrderDetails, uploadMultipleFiles, type Delivery, type FileInfo } from "../services/orderApi";
import { createPrintRequest } from "../services/printRequestApi";
import { money } from "../services/pricingApi";
import { searchServices, type ServiceSearchResult } from "../services/serviceSearchApi";
import { countPdfPages } from "../utils/pdfUtils";
import { ghs } from "../utils/ghs";

type Section = "service" | "specs" | "delivery" | "review";
const ORDER: Section[] = ["service", "specs", "delivery", "review"];

interface Selection {
	categoryId: string;
	categoryName?: string;
	subCategoryId?: string;
	serviceTemplateId: string;
	serviceName: string;
}

interface Saved {
	section: Section;
	selection: Selection | null;
	configured: ConfiguredService | null;
	delivery: Delivery | null;
	starter: { file: FileInfo; pages?: number } | null;
}

// Saved in the browser as it's entered, so signing in or reloading never loses it
const STORAGE_KEY = "printdecore_assistant_v1";
const EMPTY: Saved = { section: "service", selection: null, configured: null, delivery: null, starter: null };
const load = (): Saved => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
	} catch {
		return EMPTY;
	}
};

const toSelection = (r: ServiceSearchResult): Selection => ({
	categoryId: r.categoryId,
	categoryName: r.categoryName,
	subCategoryId: r.subCategoryId,
	serviceTemplateId: r.serviceTemplateId,
	serviceName: r.name,
});

/**
 * The Print Assistant: one short sheet — what, specs, delivery, review — for
 * a single job. Priced jobs are confirmed by the team in minutes; anything
 * without a price yet is sent as a quote request. Nothing is charged here.
 */
export const PrintAssistant = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();
	const [state, setState] = useState<Saved>(load);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const { section, selection, configured, delivery, starter } = state;
	const update = (patch: Partial<Saved>) => setState((s) => ({ ...s, ...patch }));

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// Storage blocked: the sheet still works for this visit
		}
	}, [state]);

	// Start from the phone on the account
	useEffect(() => {
		if (!delivery && user?.phoneNumber) update({ delivery: { fulfilment: "delivery", recipientPhone: user.phoneNumber } });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.phoneNumber]);

	const { data: service, isLoading: loadingService } = useQuery({
		queryKey: ["serviceOrderDetails", selection?.serviceTemplateId],
		queryFn: () => getServiceTemplateOrderDetails(selection!.serviceTemplateId),
		enabled: !!selection,
	});

	const choose = (s: Selection) => {
		if (s.serviceTemplateId === selection?.serviceTemplateId) update({ section: "specs" });
		else update({ selection: s, configured: null, section: "specs" });
	};

	const configure = (spec: ConfiguredService) => {
		const skipDelivery = deliveryReady(delivery) && !!configured;
		update({ configured: spec, section: skipDelivery ? "review" : "delivery" });
	};

	const startOver = () => {
		if (!window.confirm("Start over? This clears the product and specs. Your delivery details stay.")) return;
		update({ section: "service", selection: null, configured: null, starter: null });
	};

	const submit = async () => {
		if (!selection || !configured || !delivery || submitting) return;
		if (!user) {
			navigate(`/login?returnUrl=${encodeURIComponent("/home/print-assistant/form")}`);
			return;
		}
		setError(null);
		setSubmitting(true);
		try {
			const request = await createPrintRequest({
				categoryId: selection.categoryId,
				subCategoryId: selection.subCategoryId,
				serviceTemplateId: selection.serviceTemplateId,
				quantity: configured.quantity,
				choices: configured.choices,
				size: configured.size,
				pages: configured.pages,
				additionalDetails: configured.additionalDetails,
				attachments: configured.attachments,
				coords: userLocation ?? undefined,
				delivery,
			});
			setState({ ...EMPTY, delivery });
			toast.success("Request sent");
			navigate(`/home/print-request/${request.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Couldn't send your request");
		} finally {
			setSubmitting(false);
		}
	};

	const stateOf = (s: Section) => {
		if (s === section) return "open";
		const done =
			(s === "service" && !!selection) ||
			(s === "specs" && !!configured) ||
			(s === "delivery" && deliveryReady(delivery) && ORDER.indexOf(section) > ORDER.indexOf("delivery"));
		return done ? "done" : "upcoming";
	};

	const priced = !!configured && !configured.quoteOnRequest && configured.calculatedPrice !== null;
	const initialSpecs = configured ?? (starter ? { attachments: [starter.file], pages: starter.pages } : undefined);

	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader
				title="Print Assistant"
				appTitle
				subtitle="Tell us what you need — we'll price it or send you a quote"
				right={
					selection ? (
						<button type="button" onClick={startOver} className="mt-1 p-2 rounded-lg text-brand-ink hover:bg-fill" aria-label="Start over">
							<ArrowCounterClockwise size={18} />
						</button>
					) : undefined
				}
			/>

			<Link to="/home/print-assistant" className="-mt-3 mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-ink hover:underline">
				<ChatCircleText size={16} />
				Prefer to just describe it? Chat with the assistant
			</Link>

			<div className="space-y-3">
				<SheetSection
					index={1}
					title="What do you need printed?"
					state={stateOf("service")}
					summary={selection ? [selection.serviceName, selection.categoryName].filter(Boolean).join(" · ") : undefined}
					onChange={() => update({ section: "service" })}
				>
					<ServicePicker starter={starter} onStarter={(s) => update({ starter: s })} onChoose={choose} />
				</SheetSection>

				<SheetSection
					index={2}
					title="Specs & files"
					state={stateOf("specs")}
					summary={configured ? [...configured.summaryLines, priced ? money(configured.calculatedPrice!) : "Quote"].join(" · ") : undefined}
					onChange={() => update({ section: "specs" })}
				>
					{loadingService || !service ? (
						<SpinnerGap size={18} className="animate-spin text-brand-ink" />
					) : (
						<ProductLoader key={service.id} service={service} initial={initialSpecs} onConfigured={configure} />
					)}
				</SheetSection>

				<SheetSection
					index={3}
					title="Delivery or pickup"
					state={stateOf("delivery")}
					summary={delivery ? [delivery.fulfilment === "pickup" ? "Pick up" : delivery.address, delivery.recipientPhone].filter(Boolean).join(" · ") : undefined}
					onChange={() => update({ section: "delivery" })}
				>
					<DeliveryChoice delivery={delivery} onChange={(d) => update({ delivery: d })} onContinue={() => update({ section: "review" })} />
				</SheetSection>

				<SheetSection index={4} title="Review & send" state={stateOf("review")}>
					<div className="rounded-xl bg-brand-tint p-4">
						<p className="text-sm text-ink-2">{priced ? "Your price" : "Price"}</p>
						<p className="text-2xl font-bold text-ink">{priced ? money(configured!.calculatedPrice!) : "Quote on request"}</p>
						<p className="text-sm text-ink-2 mt-1">
							{priced
								? "We'll confirm the price and availability in about 10 minutes, then you pay from your order. Nothing is charged now."
								: "We'll send you a price on this request. Nothing is charged until you accept it."}
						</p>
					</div>
					{error && <p className="text-sm text-bad mt-3">{error}</p>}
					<button
						type="button"
						onClick={submit}
						disabled={submitting || !configured || !deliveryReady(delivery)}
						className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-brand hover:bg-brand-press text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{submitting && <SpinnerGap size={16} className="animate-spin" />}
						{!user ? "Sign in to send" : priced ? "Send request" : "Ask for a quote"}
					</button>
				</SheetSection>
			</div>
		</div>
	);
};

const SheetSection = ({
	index,
	title,
	state,
	summary,
	onChange,
	children,
}: {
	index: number;
	title: string;
	state: "open" | "done" | "upcoming";
	summary?: string;
	onChange?: () => void;
	children: ReactNode;
}) => (
	<section
		className={`rounded-xl border bg-surface ${state === "open" ? "border-brand p-5" : "border-line px-5 py-4"}`}
		aria-current={state === "open" ? "step" : undefined}
	>
		<div className="flex items-center gap-3">
			{state === "done" ? (
				<CheckCircle size={22} weight="fill" className="text-ok shrink-0" />
			) : (
				<span
					className={`w-6 h-6 shrink-0 rounded-full text-xs font-bold flex items-center justify-center ${
						state === "open" ? "bg-brand text-black" : "bg-fill text-ink-2"
					}`}
				>
					{index}
				</span>
			)}
			<div className="flex-1 min-w-0">
				<h2 className={`font-bold ${state === "upcoming" ? "text-ink-3" : "text-ink"}`}>{title}</h2>
				{state === "done" && summary && <p className="text-xs text-ink-2 truncate">{summary}</p>}
			</div>
			{state === "done" && onChange && (
				<button type="button" onClick={onChange} className="text-sm font-semibold text-brand-ink hover:underline">
					Change
				</button>
			)}
		</div>
		{state === "open" && <div className="mt-4">{children}</div>}
	</section>
);

/** Type it, pick a popular one, or start from your document */
const ServicePicker = ({
	starter,
	onStarter,
	onChoose,
}: {
	starter: Saved["starter"];
	onStarter: (s: Saved["starter"]) => void;
	onChoose: (s: Selection) => void;
}) => {
	const { user } = useAuth();
	const [text, setText] = useState("");
	const [query, setQuery] = useState("");
	const [reading, setReading] = useState(false);
	const fileInput = useRef<HTMLInputElement>(null);
	useEffect(() => {
		const t = setTimeout(() => setQuery(text.trim()), 250);
		return () => clearTimeout(t);
	}, [text]);

	const searching = query.length >= 2;
	const { data: results, isLoading } = useQuery({
		queryKey: ["serviceSearch", searching ? query : "", !!starter],
		queryFn: () => searchServices(searching ? { q: query } : starter ? { pageBased: true } : {}),
	});

	/** Read the document now (pages), upload it, and carry it into the specs */
	const pickDocument = async (file: File | undefined) => {
		if (!file) return;
		setReading(true);
		try {
			const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
			const pages = isPdf ? await countPdfPages(file).catch(() => undefined) : undefined;
			const res = await uploadMultipleFiles([file], `orders/staging/${Date.now()}`);
			if (!res.success || !res.data?.[0]) throw new Error(res.message || "Upload failed");
			onStarter({ file: res.data[0], pages });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't read your file");
		} finally {
			setReading(false);
			if (fileInput.current) fileInput.current.value = "";
		}
	};

	return (
		<div className="space-y-3">
			{starter ? (
				<div className="flex items-center gap-3 p-3 rounded-xl bg-brand-tint">
					<FileText size={20} className="text-brand-ink shrink-0" />
					<div className="flex-1 min-w-0">
						<p className="text-sm font-semibold text-ink truncate">{starter.file.name}</p>
						<p className="text-xs text-ink-2">
							{starter.pages ? `${starter.pages} page${starter.pages === 1 ? "" : "s"} · ` : ""}we'll attach it for you
						</p>
					</div>
					<button type="button" onClick={() => onStarter(null)} className="p-1 text-ink-3 hover:text-bad" aria-label="Remove file">
						<X size={16} />
					</button>
				</div>
			) : (
				<div className="relative">
					<MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
					<input
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="e.g. business cards, banner, flyers"
						aria-label="What do you need printed?"
						className="w-full pl-10 pr-4 py-3 text-sm bg-surface border border-line rounded-xl text-ink focus:outline-none focus:border-ink"
					/>
				</div>
			)}

			<p className="text-xs font-bold text-ink-3">
				{starter ? "How should we print it?" : searching ? "Results" : "Popular"}
			</p>
			{isLoading ? (
				<SpinnerGap size={18} className="animate-spin text-brand-ink" />
			) : results?.length ? (
				<div className="rounded-xl border border-line divide-y divide-line overflow-hidden">
					{results.map((r) => (
						<button
							key={r.serviceTemplateId}
							type="button"
							onClick={() => onChoose(toSelection(r))}
							className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-fill"
						>
							<span className="flex-1 min-w-0">
								<span className="block text-sm font-semibold text-ink">{r.name}</span>
								<span className="block text-xs text-ink-2">
									{r.categoryName}
									{r.quoteOnRequest ? " · quote on request" : r.startingPrice !== undefined ? ` · from ${ghs(r.startingPrice)}` : ""}
								</span>
							</span>
							<CaretRight size={14} className="text-ink-3" />
						</button>
					))}
				</div>
			) : (
				<p className="text-sm text-ink-2">
					Nothing called "{query}" yet. Pick the closest match and describe the rest in the details, or{" "}
					<Link to="/home" className="text-brand-ink font-semibold hover:underline">
						browse the catalogue
					</Link>
					.
				</p>
			)}

			{!starter &&
				(user ? (
					<>
						<button
							type="button"
							onClick={() => fileInput.current?.click()}
							disabled={reading}
							className="w-full flex items-center justify-center gap-2 px-3 py-3 text-sm rounded-xl border border-dashed border-line-strong text-ink hover:border-brand disabled:opacity-60"
						>
							{reading ? <SpinnerGap size={16} className="animate-spin" /> : <Upload size={16} />}
							{reading ? "Reading your file…" : "Or start from your file"}
						</button>
						<input ref={fileInput} type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => pickDocument(e.target.files?.[0])} />
					</>
				) : (
					<p className="text-xs text-ink-2">
						<Link to={`/login?returnUrl=${encodeURIComponent("/home/print-assistant/form")}`} className="text-brand-ink font-semibold hover:underline">
							Sign in
						</Link>{" "}
						to start from your own file.
					</p>
				))}
		</div>
	);
};

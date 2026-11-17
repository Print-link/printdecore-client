import { useEffect, useMemo, useRef, useState } from "react";
import { CaretDown, CaretUp, Check, FileText, SpinnerGap, Warning, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { useCart, type CartVendor } from "../../contexts/CartContext";
import { uploadMultipleFiles, type FileInfo, type ServiceTemplateOrderDetails } from "../../services/orderApi";
import {
	defaultUnit,
	fmtSize,
	getQuote,
	LENGTH_UNITS,
	money,
	QuoteRejected,
	toMm,
	type ArtworkSpec,
	type Choices,
	type LengthUnit,
	type ProductDefinition,
	type Quote,
	type QuoteError,
} from "../../services/pricingApi";
import { countPdfPages } from "../../utils/pdfUtils";
import { AttachmentPicker } from "./AttachmentPicker";
import type { ConfiguredService, ConfiguredStart } from "./configuredService";

interface ProductConfiguratorProps {
	product: ProductDefinition;
	service: ServiceTemplateOrderDetails;
	/** Called after the item is added to the tray */
	onAdded?: () => void;
	/** Ordering from a shop: its price for its listing, and its order */
	vendor?: CartVendor & { agentServiceId: string };
	/**
	 * Take the finished set-up instead of adding it to the tray (the Print
	 * Assistant). Also asks for "Additional details", and lets an unpriced
	 * combination through as a quote request.
	 */
	onConfigured?: (configured: ConfiguredService) => void;
	initial?: ConfiguredStart;
}

/** The options a customer starts with: the product's defaults, among what's offered */
function startingChoices(product: ProductDefinition, offered: (attr: string, opt: string) => boolean): Choices {
	const choices: Choices = {};
	for (const a of product.attributes) {
		const allowed = a.options.filter((o) => offered(a.key, o.key));
		if (a.selection === "one") {
			const key = a.defaultOptionKeys.find((k) => allowed.some((o) => o.key === k)) ?? (a.required ? allowed[0]?.key : undefined);
			if (key) choices[a.key] = key;
		} else {
			const keys = a.defaultOptionKeys.filter((k) => allowed.some((o) => o.key === k));
			if (keys.length) choices[a.key] = keys;
		}
	}
	return choices;
}

/** Simple checks on attached files, from the product's artwork spec */
function artworkWarnings(spec: ArtworkSpec | undefined, files: FileInfo[], size?: { widthMm: number; heightMm: number }): string[] {
	if (!spec) return [];
	const warnings: string[] = [];
	const types = spec.fileTypes?.map((t) => t.toLowerCase().replace(/^\./, ""));
	for (const f of files) {
		const ext = (f.format || f.name.split(".").pop() || "").toLowerCase();
		if (types?.length && ext && !types.includes(ext)) warnings.push(`${f.name}: the printer takes ${types.join(", ")} files`);
		if (spec.minDpi && size && f.width && f.height) {
			const dpi = Math.min(f.width / (size.widthMm / 25.4), f.height / (size.heightMm / 25.4));
			if (dpi < spec.minDpi) warnings.push(`${f.name} is ${Math.round(dpi)} DPI at this size — it may print blurry (${spec.minDpi}+ recommended)`);
		}
	}
	if (spec.bleedMm && files.length) warnings.push(`Leave ${spec.bleedMm} mm of bleed around your design`);
	return warnings;
}

const inputClass =
	"w-full px-3 py-2.5 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]";
const labelClass = "block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2";

/**
 * Set up a product on the new pricing: drawn from the product's definition
 * (choices, sizes, limits), with every price — and every reason a combination
 * can't be made — from the server's quote engine.
 */
export const ProductConfigurator = ({ product, service, onAdded, vendor, onConfigured, initial }: ProductConfiguratorProps) => {
	const { user } = useAuth();
	const { addToCart, cartTargetClash } = useCart();

	const disabled = useMemo(() => new Set(product.shop?.disabledOptionKeys ?? []), [product.shop]);
	const offered = (attr: string, opt: string) => !disabled.has(`${attr}:${opt}`);
	const sizeAttr = product.attributes.find((a) => a.key === product.sizeAttributeKey);
	const takesCustom = product.sizeMode === "custom" || product.sizeMode === "both";
	const otherAttrs = product.attributes.filter((a) => a !== sizeAttr);

	const initialCustom = !!initial?.size && takesCustom;
	const startsWithDocument = product.usesPages && !!initial?.pages && !!initial?.attachments?.length;
	const [choices, setChoices] = useState<Choices>(() =>
		initial?.choices ? { ...startingChoices(product, offered), ...initial.choices } : startingChoices(product, offered)
	);
	const [customSize, setCustomSize] = useState(initialCustom || product.sizeMode === "custom" || (takesCustom && !sizeAttr));
	const [unit, setUnit] = useState<LengthUnit>(initialCustom ? "mm" : defaultUnit(product));
	const [width, setWidth] = useState(initialCustom ? String(initial!.size!.widthMm) : "");
	const [height, setHeight] = useState(initialCustom ? String(initial!.size!.heightMm) : "");
	const [quantity, setQuantity] = useState(String(initial?.quantity ?? product.limits.minQuantity ?? 1));
	const [pages, setPages] = useState(initial?.pages ? String(initial.pages) : "");
	const [document, setDocument] = useState<FileInfo | null>(startsWithDocument ? initial!.attachments![0] : null);
	const [readingDocument, setReadingDocument] = useState(false);
	const [files, setFiles] = useState<FileInfo[]>((startsWithDocument ? initial!.attachments!.slice(1) : initial?.attachments) ?? []);
	const [additionalDetails, setAdditionalDetails] = useState(initial?.additionalDetails ?? "");
	const [uploading, setUploading] = useState(false);
	const [quote, setQuote] = useState<Quote | null>(null);
	const [errors, setErrors] = useState<QuoteError[]>([]);
	const [noPrice, setNoPrice] = useState(false);
	const [calculating, setCalculating] = useState(false);
	const [showLines, setShowLines] = useState(false);
	const documentInput = useRef<HTMLInputElement>(null);

	const sizeMm = useMemo(() => {
		if (customSize) {
			const w = Number(width);
			const h = Number(height);
			return w > 0 && h > 0 ? { widthMm: toMm(w, unit), heightMm: toMm(h, unit) } : undefined;
		}
		const key = sizeAttr && choices[sizeAttr.key];
		const specs = typeof key === "string" ? sizeAttr!.options.find((o) => o.key === key)?.specs : undefined;
		return specs?.widthMm && specs?.heightMm ? { widthMm: specs.widthMm, heightMm: specs.heightMm } : undefined;
	}, [customSize, width, height, unit, sizeAttr, choices]);

	const request = useMemo(() => {
		const sent = { ...choices };
		// A custom size replaces the preset
		if (customSize && sizeAttr) delete sent[sizeAttr.key];
		return {
			choices: sent,
			quantity: Number(quantity),
			...(customSize && sizeMm && { size: sizeMm }),
			...(product.usesPages && Number(pages) > 0 && { pages: Number(pages) }),
		};
	}, [choices, customSize, sizeAttr, quantity, sizeMm, product.usesPages, pages]);

	const waitingFor =
		!(request.quantity >= 1)
			? "Enter a quantity"
			: customSize && !sizeMm
				? "Enter the width and height"
				: product.usesPages && !(Number(pages) > 0)
					? "Add your document or enter its pages"
					: null;

	// Debounced, so typing "500" asks once, not three times
	useEffect(() => {
		if (waitingFor) {
			setCalculating(false);
			setQuote(null);
			setErrors([]);
			setNoPrice(false);
			return;
		}
		let cancelled = false;
		setCalculating(true);
		const t = setTimeout(() => {
			getQuote({ productId: product.id, agentServiceId: vendor?.agentServiceId, ...request })
				.then((q) => {
					if (cancelled) return;
					setQuote(q);
					setErrors([]);
					setNoPrice(false);
				})
				.catch((err) => {
					if (cancelled) return;
					setQuote(null);
					const list: QuoteError[] =
						err instanceof QuoteRejected ? err.errors : [{ code: "error", message: err?.message ?? "Couldn't price this" }];
					setNoPrice(list.some((e) => e.code === "no_price") || (err instanceof QuoteRejected && err.status === 409));
					setErrors(list.filter((e) => e.code !== "no_price"));
				})
				.finally(() => {
					if (!cancelled) setCalculating(false);
				});
		}, 500);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
	}, [product.id, vendor?.agentServiceId, request, waitingFor]);

	const pick = (attrKey: string, optKey: string, selection: "one" | "any", required: boolean) => {
		setChoices((prev) => {
			const next = { ...prev };
			if (selection === "one") {
				if (prev[attrKey] === optKey && !required) delete next[attrKey];
				else next[attrKey] = optKey;
			} else {
				const cur = (prev[attrKey] as string[] | undefined) ?? [];
				const keys = cur.includes(optKey) ? cur.filter((k) => k !== optKey) : [...cur, optKey];
				if (keys.length) next[attrKey] = keys;
				else delete next[attrKey];
			}
			return next;
		});
	};

	const isChosen = (attrKey: string, optKey: string) => {
		const v = choices[attrKey];
		return Array.isArray(v) ? v.includes(optKey) : v === optKey;
	};

	/** Count the PDF's pages; upload it too when signed in, so the printer gets it */
	const pickDocument = async (file: File | undefined) => {
		if (!file) return;
		setReadingDocument(true);
		try {
			const count = await countPdfPages(file);
			setPages(String(count));
			if (user) {
				const res = await uploadMultipleFiles([file], `orders/staging/${Date.now()}`);
				if (res.success && res.data?.[0]) setDocument(res.data[0]);
			} else {
				toast.info("Pages counted. Sign in to attach the document itself.");
			}
		} catch {
			toast.error("Couldn't read that PDF. Enter its pages instead.");
		} finally {
			setReadingDocument(false);
			if (documentInput.current) documentInput.current.value = "";
		}
	};

	const allFiles = document ? [document, ...files] : files;
	const warnings = artworkWarnings(product.artworkSpec, allFiles, sizeMm);
	const errorFor = (attrKey: string) => errors.find((e) => e.attribute === attrKey)?.message;
	const generalErrors = errors.filter((e) => !e.attribute || !product.attributes.some((a) => a.key === e.attribute));

	const summaryLines = (): string[] => {
		const lines: string[] = [];
		for (const a of product.attributes) {
			if (customSize && a === sizeAttr) continue;
			const v = (quote?.choices ?? choices)[a.key];
			const keys = Array.isArray(v) ? v : v ? [v] : [];
			const names = keys.map((k) => a.options.find((o) => o.key === k)?.name).filter(Boolean);
			if (names.length) lines.push(a === sizeAttr || a.selection === "one" ? names.join(", ") : `${a.name}: ${names.join(", ")}`);
		}
		if (customSize && sizeMm) lines.push(fmtSize(sizeMm.widthMm, sizeMm.heightMm, unit));
		lines.push(`Qty: ${quantity}`);
		if (product.usesPages && pages) lines.push(`${pages} page${pages === "1" ? "" : "s"}`);
		return lines;
	};

	// The Print Assistant takes a combination with no price yet as a quote request
	const asQuoteRequest = !!onConfigured && !quote && noPrice && !waitingFor && errors.length === 0;
	const canAdd = (!!quote || asQuoteRequest) && !calculating && !uploading && !readingDocument;

	const reset = () => {
		setChoices(startingChoices(product, offered));
		setQuantity(String(product.limits.minQuantity ?? 1));
		setWidth("");
		setHeight("");
		setPages("");
		setDocument(null);
		setFiles([]);
		setQuote(null);
	};

	const handleSubmit = () => {
		if (!canAdd) return;
		if (onConfigured) {
			onConfigured({
				serviceTemplateId: service.id,
				quantity: request.quantity,
				choices: quote?.choices ?? request.choices,
				...(request.size && { size: request.size }),
				...(request.pages && { pages: request.pages }),
				additionalDetails: additionalDetails.trim() || undefined,
				attachments: allFiles,
				calculatedPrice: quote ? quote.total : null,
				quoteOnRequest: !quote,
				summaryLines: summaryLines(),
			});
			return;
		}
		if (!quote) return;
		const target = vendor ? { id: vendor.id, name: vendor.name } : null;
		if (
			cartTargetClash(target) &&
			!window.confirm(
				target
					? `Your tray has items for another order. Start a new tray for ${target.name}?`
					: "Your tray has items from a shop. Start a new tray for Printdecore?"
			)
		)
			return;
		addToCart(
			{
				id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
				serviceTemplateId: service.id,
				agentServiceId: vendor?.agentServiceId,
				serviceName: service.name,
				measurementUnit: service.measurementUnit,
				quantity: request.quantity,
				choices: request.choices,
				size: request.size,
				pages: request.pages,
				files: allFiles,
				summaryLines: summaryLines(),
				calculatedPrice: quote.total,
			},
			target
		);
		toast.success(`${service.name} added to your tray`);
		reset();
		onAdded?.();
	};

	const chip = (active: boolean) =>
		`px-3.5 py-2 text-sm rounded-lg border transition-colors text-left ${
			active
				? "border-[#fbbf24] bg-[#fbbf24] text-black"
				: "border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-[#fbbf24]/60"
		}`;

	return (
		<div className="space-y-5">
			{(sizeAttr || takesCustom) && product.sizeMode !== "none" && (
				<div>
					<p className={labelClass}>Size</p>
					<div className="flex flex-wrap gap-2">
						{sizeAttr?.options
							.filter((o) => offered(sizeAttr.key, o.key))
							.map((o) => {
								const active = !customSize && isChosen(sizeAttr.key, o.key);
								return (
									<button
										type="button"
										key={o.key}
										className={chip(active)}
										aria-pressed={active}
										onClick={() => {
											setCustomSize(false);
											pick(sizeAttr.key, o.key, "one", true);
										}}
									>
										<span className="font-medium block">{o.name}</span>
										{o.specs?.widthMm && o.specs?.heightMm ? (
											<span className={`text-xs ${active ? "text-black/70" : "text-gray-500"}`}>
												{fmtSize(o.specs.widthMm, o.specs.heightMm, unit)}
											</span>
										) : null}
									</button>
								);
							})}
						{takesCustom && sizeAttr && (
							<button type="button" className={chip(customSize)} aria-pressed={customSize} onClick={() => setCustomSize(true)}>
								<span className="font-medium">Custom size</span>
							</button>
						)}
					</div>
					{customSize && (
						<div className="mt-3 space-y-2">
							<div className="flex gap-1.5" role="group" aria-label="Unit">
								{LENGTH_UNITS.map((u) => (
									<button
										type="button"
										key={u}
										onClick={() => setUnit(u)}
										aria-pressed={unit === u}
										className={`px-3 py-1 text-xs rounded-full border ${
											unit === u ? "border-[#fbbf24] font-semibold text-gray-900 dark:text-white" : "border-gray-200 dark:border-gray-700 text-gray-500"
										}`}
									>
										{u}
									</button>
								))}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<label className="text-xs text-gray-500">
									Width ({unit})
									<input className={`${inputClass} mt-1`} inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} />
								</label>
								<label className="text-xs text-gray-500">
									Height ({unit})
									<input className={`${inputClass} mt-1`} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
								</label>
							</div>
						</div>
					)}
				</div>
			)}

			{otherAttrs.map((a) => {
				const opts = a.options.filter((o) => offered(a.key, o.key));
				if (!opts.length) return null;
				const err = errorFor(a.key);
				return (
					<fieldset key={a.key}>
						<legend className={labelClass}>
							{a.name}
							{!a.required && a.selection === "one" && <span className="ml-2 text-xs font-normal text-gray-400">optional</span>}
						</legend>
						<div className={`rounded-xl border divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden ${err ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
							{opts.map((o) => {
								const active = isChosen(a.key, o.key);
								return (
									<button
										type="button"
										key={o.key}
										role={a.selection === "one" ? "radio" : "checkbox"}
										aria-checked={active}
										onClick={() => pick(a.key, o.key, a.selection, a.required)}
										className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
									>
										<span
											className={`w-5 h-5 shrink-0 flex items-center justify-center border-2 ${a.selection === "one" ? "rounded-full" : "rounded"} ${
												active ? "border-[#fbbf24] bg-[#fbbf24]" : "border-gray-300 dark:border-gray-600"
											}`}
										>
											{active && (a.selection === "one" ? <span className="w-2 h-2 rounded-full bg-black" /> : <Check size={12} weight="bold" />)}
										</span>
										<span className="font-medium text-gray-800 dark:text-gray-200">{o.name}</span>
									</button>
								);
							})}
						</div>
						{err && <p className="mt-1 text-xs text-red-500">{err}</p>}
					</fieldset>
				);
			})}

			<label className="block">
				<span className={labelClass}>Quantity</span>
				<input className={inputClass} inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
				{(product.limits.minQuantity || product.limits.maxQuantity) && (
					<span className="block mt-1 text-xs text-gray-500">
						{[product.limits.minQuantity && `From ${product.limits.minQuantity}`, product.limits.maxQuantity && `up to ${product.limits.maxQuantity}`]
							.filter(Boolean)
							.join(" · ")}
					</span>
				)}
			</label>

			{product.usesPages && (
				<div>
					<p className={labelClass}>Document</p>
					{document ? (
						<div className="flex items-center gap-3 px-3 py-2.5 mb-2 rounded-lg border border-gray-200 dark:border-gray-700">
							<FileText size={18} className="text-[#d97706] shrink-0" />
							<span className="flex-1 min-w-0 truncate text-sm text-gray-800 dark:text-gray-200">{document.name}</span>
							<button
								type="button"
								onClick={() => {
									setDocument(null);
									setPages("");
								}}
								className="p-1 text-gray-400 hover:text-red-500"
								aria-label="Remove document"
							>
								<X size={14} />
							</button>
						</div>
					) : (
						<button
							type="button"
							onClick={() => documentInput.current?.click()}
							disabled={readingDocument}
							className="w-full mb-2 flex items-center justify-center gap-2 px-3 py-3 text-sm rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-[#fbbf24] disabled:opacity-60"
						>
							{readingDocument ? <SpinnerGap size={16} className="animate-spin" /> : <FileText size={16} />}
							{readingDocument ? "Reading your document…" : "Add a PDF to count its pages"}
						</button>
					)}
					<input ref={documentInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickDocument(e.target.files?.[0])} />
					<label className="text-xs text-gray-500">
						Pages
						<input className={`${inputClass} mt-1`} inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} />
					</label>
				</div>
			)}

			<AttachmentPicker files={files} onChange={setFiles} onUploadingChange={setUploading} />

			{warnings.length > 0 && (
				<div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-sm text-gray-800 dark:text-gray-200">
					<Warning size={16} className="text-amber-600 shrink-0 mt-0.5" />
					<div className="space-y-1">
						{warnings.map((w, i) => (
							<p key={i}>{w}</p>
						))}
					</div>
				</div>
			)}

			{onConfigured && (
				<label className="block">
					<span className={labelClass}>Additional details (optional)</span>
					<textarea
						className={inputClass}
						rows={3}
						value={additionalDetails}
						onChange={(e) => setAdditionalDetails(e.target.value)}
						placeholder="Anything the printer should know"
					/>
				</label>
			)}

			<div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-5 text-center" aria-live="polite">
				<p className="text-sm text-gray-500">Your price</p>
				<p className="text-3xl font-black text-gray-900 dark:text-white mt-1">
					{calculating ? "Calculating…" : quote ? money(quote.total, quote.currency) : "—"}
				</p>
				{!calculating && quote && request.quantity > 1 && (
					<p className="text-xs text-gray-500 mt-1">
						{quote.currency} {(quote.total / request.quantity).toFixed(2)} each
					</p>
				)}
				{!calculating && !quote && (
					<p className={`text-xs mt-1 ${generalErrors.length ? "text-red-500" : "text-gray-500"}`}>
						{waitingFor ??
							(noPrice
								? onConfigured
									? "This isn't priced yet — continue and we'll send you a quote"
									: "This isn't priced yet — try another option, or use the Print Assistant to ask for a quote"
								: (generalErrors[0]?.message ?? (errors.length ? "Check the options above" : "")))}
					</p>
				)}
				{quote && (
					<button
						type="button"
						onClick={() => setShowLines(!showLines)}
						className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#d97706]"
						aria-expanded={showLines}
					>
						{showLines ? "Hide" : "How it's worked out"}
						{showLines ? <CaretUp size={12} /> : <CaretDown size={12} />}
					</button>
				)}
				{quote && showLines && (
					<dl className="mt-3 space-y-1.5 text-left text-sm">
						{quote.lines.map((l, i) => (
							<div key={i} className="flex gap-3">
								<dt className="flex-1 text-gray-800 dark:text-gray-200">
									{l.label}
									{l.detail && <span className="block text-xs text-gray-500">{l.detail}</span>}
								</dt>
								<dd className="text-gray-800 dark:text-gray-200 tabular-nums">{l.amount.toFixed(2)}</dd>
							</div>
						))}
					</dl>
				)}
			</div>

			<button
				type="button"
				onClick={handleSubmit}
				disabled={!canAdd}
				className="w-full py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{onConfigured ? (asQuoteRequest ? "Continue — ask for a quote" : "Continue") : "Add to tray"}
			</button>
		</div>
	);
};

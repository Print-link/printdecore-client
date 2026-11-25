import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretDown, CaretUp, Check, FileText, Minus, Plus, SpinnerGap, Warning, X } from "@phosphor-icons/react";
import { ActionBar, BarTotal, Button } from "../ui";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { useCart, type CartVendor } from "../../contexts/CartContext";
import { uploadMultipleFiles, type FileInfo, type ServiceTemplateOrderDetails } from "../../services/orderApi";
import {
	defaultUnit,
	fmtSize,
	getQuote,
	inputTypeOf,
	isOptionField,
	LENGTH_UNITS,
	money,
	QuoteRejected,
	toMm,
	type ArtworkSpec,
	type Choices,
	type FieldAnswers,
	type LengthUnit,
	type ProductAttribute,
	type ProductDefinition,
	type Quote,
	type QuoteError,
} from "../../services/pricingApi";
import { countPdfPages } from "../../utils/pdfUtils";
import { AttachmentPicker } from "./AttachmentPicker";
import type { ConfiguredService, ConfiguredStart } from "./configuredService";
import { ServiceFieldInput } from "./ServiceFieldInput";
import { answerForConditions, answerSummary, initialDraft, toAnswer, type FieldDraft } from "./serviceFields";
import { evaluateCondition } from "../../utils/conditions";
import { startChatQuote } from "./assistantHandoff";

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
		if (!isOptionField(a)) continue;
		const allowed = a.options.filter((o) => offered(a.key, o.key));
		if (inputTypeOf(a) === "select") {
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
	"w-full h-11 px-3 text-base bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink";
const sectionTitle = "block mb-3 text-lg font-bold title-tight text-ink";
const fieldLabel = "block mb-1.5 text-sm text-ink-2";
const tile = (active: boolean) =>
	`tap min-w-[88px] px-3.5 py-2.5 rounded-xl text-left ${active ? "bg-ink text-page" : "bg-fill text-ink hover:bg-fill-press"}`;

/**
 * Set up a product on the new pricing: drawn from the product's definition
 * (choices, sizes, limits), with every price — and every reason a combination
 * can't be made — from the server's quote engine.
 */
export const ProductConfigurator = ({ product, service, onAdded, vendor, onConfigured, initial }: ProductConfiguratorProps) => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const quoteMode = product.quoteMode === "quote";
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
	const [fieldDrafts, setFieldDrafts] = useState<Record<string, FieldDraft>>(() => {
		const start: Record<string, FieldDraft> = {};
		for (const a of product.attributes) if (!isOptionField(a)) start[a.key] = initial?.fieldDrafts?.[a.key] ?? initialDraft(a);
		return start;
	});
	const [fieldUploads, setFieldUploads] = useState(0);
	const documentInput = useRef<HTMLInputElement>(null);

	/**
	 * Which fields are shown, in order: a field's rule reads only the answers
	 * above it (the server applies the same rules and ignores hidden answers)
	 */
	const visible = useMemo(() => {
		const answers: Record<string, unknown> = {};
		const shown = new Set<string>();
		for (const a of product.attributes) {
			if (!evaluateCondition(a.visibleWhen, answers)) continue;
			shown.add(a.key);
			answers[a.key] = isOptionField(a) ? choices[a.key] : answerForConditions(a, fieldDrafts[a.key]);
		}
		return shown;
	}, [product.attributes, choices, fieldDrafts]);
	const isShown = (a: ProductAttribute) => visible.has(a.key);

	const fields = useMemo(() => {
		const out: FieldAnswers = {};
		for (const a of product.attributes) {
			if (isOptionField(a) || !visible.has(a.key)) continue;
			const v = toAnswer(a, fieldDrafts[a.key]);
			if (v !== undefined) out[a.key] = v;
		}
		return out;
	}, [product.attributes, visible, fieldDrafts]);
	const missingField = product.attributes.find(
		(a) => !isOptionField(a) && a.required && inputTypeOf(a) !== "checkbox" && visible.has(a.key) && fields[a.key] === undefined
	);

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
		const sent: Choices = {};
		// Hidden choices aren't sent; a custom size replaces the preset
		for (const [k, v] of Object.entries(choices)) if (visible.has(k)) sent[k] = v;
		if (customSize && sizeAttr) delete sent[sizeAttr.key];
		return {
			choices: sent,
			quantity: Number(quantity),
			...(customSize && sizeMm && { size: sizeMm }),
			...(product.usesPages && Number(pages) > 0 && { pages: Number(pages) }),
			...(Object.keys(fields).length > 0 && { fields }),
		};
	}, [choices, visible, customSize, sizeAttr, quantity, sizeMm, product.usesPages, pages, fields]);

	const waitingFor =
		!(request.quantity >= 1)
			? "Enter a quantity"
			: customSize && !sizeMm
				? "Enter the width and height"
				: product.usesPages && !(Number(pages) > 0)
					? "Add your document or enter its pages"
					: missingField
						? `Fill in ${missingField.name.toLowerCase()}`
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
					// A quote-on-request service answers "quote_required" once the answers are complete
					setNoPrice(list.some((e) => e.code === "no_price" || e.code === "quote_required") || (err instanceof QuoteRejected && err.status === 409));
					setErrors(list.filter((e) => e.code !== "no_price" && e.code !== "quote_required"));
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
			if (!isShown(a)) continue;
			if (!isOptionField(a)) {
				const line = answerSummary(a, fieldDrafts[a.key]);
				if (line) lines.push(line);
				continue;
			}
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

	// The Print Assistant takes a combination with no price yet as a quote request;
	// a quote-on-request service always goes that way, from any page
	const asQuoteRequest = (!!onConfigured || quoteMode) && !quote && noPrice && !waitingFor && errors.length === 0;
	const canAdd = (!!quote || asQuoteRequest) && !calculating && !uploading && !readingDocument && fieldUploads === 0;

	const reset = () => {
		setChoices(startingChoices(product, offered));
		setQuantity(String(product.limits.minQuantity ?? 1));
		setWidth("");
		setHeight("");
		setPages("");
		setDocument(null);
		setFiles([]);
		setQuote(null);
		setFieldDrafts(Object.fromEntries(product.attributes.filter((a) => !isOptionField(a)).map((a) => [a.key, initialDraft(a)])));
	};

	const configuredNow = (): ConfiguredService => ({
		serviceTemplateId: service.id,
		quantity: request.quantity,
		choices: quote?.choices ?? request.choices,
		...(request.size && { size: request.size }),
		...(request.pages && { pages: request.pages }),
		...(request.fields && { fields: request.fields, fieldDrafts }),
		additionalDetails: additionalDetails.trim() || undefined,
		attachments: allFiles,
		calculatedPrice: quote ? quote.total : null,
		quoteOnRequest: !quote,
		summaryLines: summaryLines(),
	});

	const [askingQuote, setAskingQuote] = useState(false);
	const handleSubmit = async () => {
		if (!canAdd) return;
		if (onConfigured) {
			onConfigured(configuredNow());
			return;
		}
		if (!quote && quoteMode) {
			// The shop prices it: Printy opens the shop's chat on this job to explain it,
			// answer questions and send it for the shop's quote
			if (!user) {
				navigate(`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`);
				return;
			}
			setAskingQuote(true);
			try {
				const path = await startChatQuote(
					{
						productId: product.id,
						...request,
						notes: additionalDetails.trim() || undefined,
						attachments: allFiles.length ? allFiles : undefined,
					},
					undefined,
					vendor?.id,
				);
				navigate(path);
			} catch (err) {
				toast.error(err instanceof Error ? err.message : "Couldn't start the chat with the shop");
			} finally {
				setAskingQuote(false);
			}
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
				...(request.fields && { fields: request.fields }),
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

	const priceText = calculating ? "Calculating…" : quote ? money(quote.total, quote.currency) : "—";
	const hint = !calculating && !quote
		? waitingFor ??
			(noPrice
				? quoteMode
					? vendor
						? `${vendor.name} prices this job on request — send it for a quote`
						: "This job is priced on request — send it for a quote"
					: onConfigured
						? "Not priced yet — continue and we'll send you a quote"
						: "Not priced yet — try another option, or ask the Print Assistant for a quote"
				: (generalErrors[0]?.message ?? (errors.length ? "Check the options above" : "")))
		: "";
	const submitLabel = onConfigured ? (asQuoteRequest ? "Ask for a quote" : "Continue") : asQuoteRequest ? "Ask for a quote" : "Add to tray";
	const priceLabel = quoteMode ? "Price" : "Your price";
	const shownPrice = quoteMode && !quote ? (calculating ? "Checking…" : "On request") : priceText;

	return (
		<div>
			{(product.gallery?.length || product.description) && (
				<section className="pb-6">
					{product.gallery && product.gallery.length > 0 && (
						<div className="-mx-4 px-4 flex gap-2 overflow-x-auto snap-x pb-1" aria-label="Pictures of this service">
							{product.gallery.map((g, i) => (
								<img
									key={g.url}
									src={g.url}
									alt={g.alt ?? `${product.name} ${i + 1}`}
									loading="lazy"
									className="snap-start shrink-0 w-64 h-44 object-cover rounded-xl bg-fill ring-1 ring-inset ring-line"
								/>
							))}
						</div>
					)}
					{product.description && <p className="mt-3 text-sm text-ink-2 whitespace-pre-line">{product.description}</p>}
				</section>
			)}
			{(sizeAttr || takesCustom) && product.sizeMode !== "none" && (
				<section className="pb-6">
					<h3 className={sectionTitle}>Size</h3>
					<div className="flex flex-wrap gap-2">
						{sizeAttr?.options
							.filter((o) => offered(sizeAttr.key, o.key))
							.map((o) => {
								const active = !customSize && isChosen(sizeAttr.key, o.key);
								return (
									<button
										type="button"
										key={o.key}
										className={tile(active)}
										aria-pressed={active}
										onClick={() => {
											setCustomSize(false);
											pick(sizeAttr.key, o.key, "one", true);
										}}
									>
										<span className="block text-sm font-semibold">{o.name}</span>
										{o.specs?.widthMm && o.specs?.heightMm ? (
											<span className={`num block text-xs ${active ? "opacity-70" : "text-ink-2"}`}>{fmtSize(o.specs.widthMm, o.specs.heightMm, unit)}</span>
										) : null}
									</button>
								);
							})}
						{takesCustom && sizeAttr && (
							<button type="button" className={tile(customSize)} aria-pressed={customSize} onClick={() => setCustomSize(true)}>
								<span className="block text-sm font-semibold">Custom size</span>
							</button>
						)}
					</div>
					{customSize && (
						<div className="mt-3 space-y-3">
							<div className="inline-flex p-0.5 rounded-lg bg-fill" role="group" aria-label="Unit">
								{LENGTH_UNITS.map((u) => (
									<button
										type="button"
										key={u}
										onClick={() => setUnit(u)}
										aria-pressed={unit === u}
										className={`h-8 px-3 text-sm rounded-md ${unit === u ? "bg-surface text-ink font-semibold ring-1 ring-line" : "text-ink-2"}`}
									>
										{u}
									</button>
								))}
							</div>
							<div className="grid grid-cols-2 gap-3">
								<label className="block">
									<span className={fieldLabel}>Width ({unit})</span>
									<input className={inputClass} inputMode="decimal" value={width} onChange={(e) => setWidth(e.target.value)} />
								</label>
								<label className="block">
									<span className={fieldLabel}>Height ({unit})</span>
									<input className={inputClass} inputMode="decimal" value={height} onChange={(e) => setHeight(e.target.value)} />
								</label>
							</div>
						</div>
					)}
				</section>
			)}

			{otherAttrs.map((a) => {
				if (!isShown(a)) return null;
				const err = errorFor(a.key);
				if (!isOptionField(a)) {
					const type = inputTypeOf(a);
					return (
						<fieldset key={a.key} className="pb-6">
							<legend className={sectionTitle}>
								{a.name}
								{!a.required && type !== "checkbox" && <span className="ml-2 text-sm font-normal text-ink-3">Optional</span>}
							</legend>
							{a.helpText && type !== "checkbox" && <p className="-mt-1.5 mb-3 text-sm text-ink-2">{a.helpText}</p>}
							{a.instructionImageUrl && (
								<img src={a.instructionImageUrl} alt={`How to fill in ${a.name.toLowerCase()}`} loading="lazy" className="mb-3 w-full max-h-56 object-contain rounded-xl bg-fill ring-1 ring-inset ring-line" />
							)}
							<ServiceFieldInput
								attr={a}
								value={fieldDrafts[a.key]}
								onChange={(v) => setFieldDrafts((prev) => ({ ...prev, [a.key]: v }))}
								onUploadingChange={(busy) => setFieldUploads((n) => Math.max(0, n + (busy ? 1 : -1)))}
							/>
							{err && <p className="mt-2 text-sm text-bad">{err}</p>}
						</fieldset>
					);
				}
				const selection = inputTypeOf(a) === "select" ? "one" : "any";
				const opts = a.options.filter((o) => offered(a.key, o.key));
				if (!opts.length) return null;
				return (
					<fieldset key={a.key} className="pb-6">
						<legend className={sectionTitle}>
							{a.name}
							{!a.required && selection === "one" && <span className="ml-2 text-sm font-normal text-ink-3">Optional</span>}
							{selection === "any" && <span className="ml-2 text-sm font-normal text-ink-3">Choose any</span>}
						</legend>
						{a.helpText && <p className="-mt-1.5 mb-3 text-sm text-ink-2">{a.helpText}</p>}
						{a.instructionImageUrl && (
							<img src={a.instructionImageUrl} alt={`About ${a.name.toLowerCase()}`} loading="lazy" className="mb-3 w-full max-h-56 object-contain rounded-xl bg-fill ring-1 ring-inset ring-line" />
						)}
						<div className="border-t border-line">
							{opts.map((o) => {
								const active = isChosen(a.key, o.key);
								return (
									<button
										type="button"
										key={o.key}
										role={selection === "one" ? "radio" : "checkbox"}
										aria-checked={active}
										onClick={() => pick(a.key, o.key, selection, a.required)}
										className="tap w-full flex items-center gap-3 min-h-12 py-3 border-b border-line text-left"
									>
										{o.imageUrl && <img src={o.imageUrl} alt="" loading="lazy" className="w-12 h-12 shrink-0 object-cover rounded-lg bg-fill ring-1 ring-inset ring-line" />}
										<span className="flex-1 min-w-0">
											<span className={`block text-base ${active ? "font-semibold text-ink" : "text-ink"}`}>{o.name}</span>
											{o.description && <span className="block text-sm text-ink-2">{o.description}</span>}
										</span>
										{selection === "one" ? (
											<span className={`w-5 h-5 shrink-0 rounded-full ${active ? "border-[6px] border-ink" : "border-[1.5px] border-line-strong"}`} />
										) : (
											<span className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center ${active ? "bg-ink text-page" : "border-[1.5px] border-line-strong"}`}>
												{active && <Check size={12} weight="bold" />}
											</span>
										)}
									</button>
								);
							})}
						</div>
						{err && <p className="mt-2 text-sm text-bad">{err}</p>}
					</fieldset>
				);
			})}

			<section className="pb-6">
				<h3 className={sectionTitle}>Quantity</h3>
				<div className="flex items-center gap-3">
					<div className="inline-flex items-center h-11 rounded-xl bg-fill">
						<button
							type="button"
							aria-label="Fewer"
							onClick={() => setQuantity(String(Math.max(product.limits.minQuantity ?? 1, (Number(quantity) || 1) - 1)))}
							className="tap w-11 h-11 flex items-center justify-center text-ink"
						>
							<Minus size={16} weight="bold" />
						</button>
						<input
							className="num w-16 h-11 bg-transparent text-center text-base font-semibold text-ink outline-none"
							inputMode="numeric"
							aria-label="Quantity"
							value={quantity}
							onChange={(e) => setQuantity(e.target.value.replace(/[^0-9]/g, ""))}
						/>
						<button
							type="button"
							aria-label="More"
							onClick={() => setQuantity(String((Number(quantity) || 0) + 1))}
							className="tap w-11 h-11 flex items-center justify-center text-ink"
						>
							<Plus size={16} weight="bold" />
						</button>
					</div>
					{(product.limits.minQuantity || product.limits.maxQuantity) && (
						<span className="num text-sm text-ink-2">
							{[product.limits.minQuantity && `From ${product.limits.minQuantity}`, product.limits.maxQuantity && `up to ${product.limits.maxQuantity}`]
								.filter(Boolean)
								.join(" · ")}
						</span>
					)}
				</div>
			</section>

			{product.usesPages && (
				<section className="pb-6">
					<h3 className={sectionTitle}>Document</h3>
					{document ? (
						<div className="flex items-center gap-3 h-12 px-3 mb-3 rounded-xl bg-fill">
							<FileText size={18} className="text-ink-2 shrink-0" />
							<span className="flex-1 min-w-0 truncate text-sm text-ink">{document.name}</span>
							<button
								type="button"
								onClick={() => {
									setDocument(null);
									setPages("");
								}}
								className="tap p-1.5 -mr-1 text-ink-3 hover:text-bad"
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
							className="tap w-full h-12 mb-3 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border border-dashed border-line-strong text-ink"
						>
							{readingDocument ? <SpinnerGap size={16} className="animate-spin" /> : <FileText size={16} />}
							{readingDocument ? "Reading your document…" : "Add a PDF to count its pages"}
						</button>
					)}
					<input ref={documentInput} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => pickDocument(e.target.files?.[0])} />
					<label className="block">
						<span className={fieldLabel}>Pages</span>
						<input className={inputClass} inputMode="numeric" value={pages} onChange={(e) => setPages(e.target.value)} />
					</label>
				</section>
			)}

			<section className="pb-6">
				<AttachmentPicker files={files} onChange={setFiles} onUploadingChange={setUploading} />
			</section>

			{warnings.length > 0 && (
				<div className="flex gap-2.5 mb-6 p-3 rounded-xl bg-brand-tint text-sm text-ink">
					<Warning size={18} className="text-brand-ink shrink-0" />
					<div className="space-y-1">
						{warnings.map((w, i) => (
							<p key={i}>{w}</p>
						))}
					</div>
				</div>
			)}

			{onConfigured && (
				<label className="block pb-6">
					<span className={sectionTitle}>Additional details <span className="text-sm font-normal text-ink-3">Optional</span></span>
					<textarea
						className={`${inputClass} h-auto py-3`}
						rows={3}
						value={additionalDetails}
						onChange={(e) => setAdditionalDetails(e.target.value)}
						placeholder="Anything the printer should know"
					/>
				</label>
			)}

			{/* How the price is made up */}
			{quote && !calculating && (
				<section className="pb-6">
					<button
						type="button"
						onClick={() => setShowLines(!showLines)}
						className="tap w-full flex items-center justify-between py-3 border-y border-line text-sm"
						aria-expanded={showLines}
					>
						<span className="font-semibold text-ink">Price breakdown</span>
						<span className="num flex items-center gap-1.5 text-ink-2">
							{request.quantity > 1 && `${quote.currency} ${(quote.total / request.quantity).toFixed(2)} each`}
							{showLines ? <CaretUp size={14} /> : <CaretDown size={14} />}
						</span>
					</button>
					{showLines && (
						<dl className="py-2 border-b border-line">
							{quote.lines.map((l, i) => (
								<div key={i} className="flex gap-3 py-1.5 text-sm">
									<dt className="flex-1 text-ink">
										{l.label}
										{l.detail && <span className="block text-xs text-ink-3">{l.detail}</span>}
									</dt>
									<dd className="num text-ink">{l.amount.toFixed(2)}</dd>
								</div>
							))}
						</dl>
					)}
				</section>
			)}

			{onConfigured ? (
				<div className="pt-2" aria-live="polite">
					<div className="flex items-baseline justify-between mb-3">
						<span className="text-sm text-ink-2">{priceLabel}</span>
						<span className="num text-xl font-bold text-ink">{shownPrice}</span>
					</div>
					{hint && <p className={`mb-3 text-sm ${generalErrors.length ? "text-bad" : "text-ink-2"}`}>{hint}</p>}
					<Button block onClick={handleSubmit} disabled={!canAdd} loading={askingQuote}>{submitLabel}</Button>
				</div>
			) : (
				<>
					{hint && <p className={`mb-2 text-sm ${generalErrors.length ? "text-bad" : "text-ink-2"}`} aria-live="polite">{hint}</p>}
					<ActionBar>
						<BarTotal label={priceLabel} value={shownPrice} />
						<Button onClick={handleSubmit} disabled={!canAdd} loading={askingQuote}>{submitLabel}</Button>
					</ActionBar>
				</>
			)}
		</div>
	);
};

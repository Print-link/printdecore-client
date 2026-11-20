import axios from "axios";
import type { ApiResponse } from "./api";
import { BASE_URL, getAuthHeaders, handleApiError } from "./orderApi";

/**
 * Pricing v2: a product described by choices and options, priced by the
 * server's one quote engine. The configurator draws GET /products/:id and
 * shows every price from POST /quotes — the browser never works out a price.
 */

export type PricingUnit = "item" | "sqft" | "sqm" | "side" | "sheet";
export type Choices = Record<string, string | string[]>;

export interface ProductOption {
	key: string;
	name: string;
	specs?: { sides?: number; widthMm?: number; heightMm?: number };
}

export interface ProductAttribute {
	key: string;
	name: string;
	selection: "one" | "any";
	required: boolean;
	defaultOptionKeys: string[];
	options: ProductOption[];
}

export interface ArtworkSpec {
	fileTypes?: string[];
	minDpi?: number;
	bleedMm?: number;
}

export interface ProductDefinition {
	id: string;
	name: string;
	pricingModel: "legacy" | "v2";
	pricingUnit: PricingUnit;
	sizeMode: "none" | "preset" | "custom" | "both";
	/** The choice whose options are preset sizes */
	sizeAttributeKey?: string;
	limits: {
		minWidthMm?: number;
		maxWidthMm?: number;
		minHeightMm?: number;
		maxHeightMm?: number;
		minQuantity?: number;
		maxQuantity?: number;
	};
	/** The customer's document pages decide the price */
	usesPages: boolean;
	attributes: ProductAttribute[];
	artworkSpec?: ArtworkSpec;
	/** With a shop: null when it doesn't sell this on the new pricing, else the options it switched off */
	shop?: { disabledOptionKeys: string[] } | null;
}

export interface QuoteLine {
	kind: "base" | "modifier" | "setup" | "minimum" | "vat" | "rounding";
	label: string;
	detail?: string;
	amount: number;
}

export interface QuoteError {
	code: string;
	message: string;
	attribute?: string;
}

export interface Quote {
	currency: string;
	lines: QuoteLine[];
	subtotal: number;
	vat: { ratePct: number; amount: number } | null;
	total: number;
	unitPrice: number;
	choices: Choices;
}

export interface QuoteInput {
	productId: string;
	/** A shop's price for its own listing of the product */
	agentServiceId?: string;
	choices: Choices;
	quantity: number;
	size?: { widthMm: number; heightMm: number };
	pages?: number;
}

/** A quote the engine couldn't give, with every reason (e.g. a rule the choices break). */
export class QuoteRejected extends Error {
	errors: QuoteError[];
	status: number;
	constructor(errors: QuoteError[], status: number) {
		super(errors[0]?.message ?? "Can't price this");
		this.errors = errors;
		this.status = status;
	}
}

export const getProduct = async (productId: string, branchId?: string): Promise<ProductDefinition> => {
	try {
		const response = await axios.get<ApiResponse<ProductDefinition>>(`${BASE_URL}/products/${productId}`, {
			params: branchId ? { branchId } : undefined,
			headers: getAuthHeaders(),
		});
		if (!response.data.data) throw new Error(response.data.message || "Product not found");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't load this product");
	}
};

export const getQuote = async (input: QuoteInput): Promise<Quote> => {
	try {
		const { agentServiceId, productId, ...body } = input;
		const response = await axios.post<ApiResponse<Quote>>(
			`${BASE_URL}/quotes`,
			{ ...(agentServiceId ? { agentServiceId } : { productId }), ...body },
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't price this");
		return response.data.data;
	} catch (error) {
		if (axios.isAxiosError(error) && error.response) {
			const data = error.response.data as { message?: string; errors?: QuoteError[] };
			throw new QuoteRejected(data.errors ?? [{ code: "error", message: data.message ?? "Couldn't price this" }], error.response.status);
		}
		return handleApiError(error, "Couldn't price this");
	}
};

// ── Units: sizes are stored in millimetres, shown in the customer's unit ──

export type LengthUnit = "mm" | "cm" | "in" | "ft";
export const LENGTH_UNITS: LengthUnit[] = ["cm", "in", "ft", "mm"];
const MM_PER: Record<LengthUnit, number> = { mm: 1, cm: 10, in: 25.4, ft: 304.8 };
const DP: Record<LengthUnit, number> = { mm: 0, cm: 1, in: 2, ft: 2 };

export const toMm = (value: number, unit: LengthUnit) => value * MM_PER[unit];
export const fromMm = (mm: number, unit: LengthUnit) => mm / MM_PER[unit];
export const fmtLength = (mm: number, unit: LengthUnit) => String(Number(fromMm(mm, unit).toFixed(DP[unit])));
export const fmtSize = (w: number, h: number, unit: LengthUnit) => `${fmtLength(w, unit)} × ${fmtLength(h, unit)} ${unit}`;

/** The unit a product is usually sized in: feet for banners and the like, cm otherwise */
export const defaultUnit = (product: ProductDefinition): LengthUnit => (product.pricingUnit === "sqft" ? "ft" : "cm");

export const money = (amount: number, currency = "GHS") =>
	`${currency} ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

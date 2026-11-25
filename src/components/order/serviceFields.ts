import type { FileInfo } from "../../services/orderApi";
import { inputTypeOf, toMm, type LengthUnit, type ProductAttribute } from "../../services/pricingApi";

/**
 * Input fields a shop added to its service (text, number, measurement,
 * width × height, file, date, yes/no): values as typed, and toAnswer() to turn
 * them into what the server checks and prices.
 */

export type FieldDraft =
	| boolean
	| string
	| { value: string; unit: LengthUnit }
	| { width: string; height: string; unit: LengthUnit }
	| FileInfo[]
	| undefined;

const UNITS: LengthUnit[] = ["cm", "m", "mm", "in", "ft"];
export const unitsFor = (a: ProductAttribute): LengthUnit[] => (a.config?.units?.length ? a.config.units : UNITS);
export const firstUnit = (a: ProductAttribute): LengthUnit => a.config?.defaultUnit ?? unitsFor(a)[0];

/** The starting value: the shop's default, else empty */
type DefaultShape = { value?: number; width?: number; height?: number; unit?: LengthUnit };

export function initialDraft(a: ProductAttribute): FieldDraft {
	const raw = a.defaultValue;
	const d = (raw && typeof raw === "object" ? raw : {}) as DefaultShape;
	switch (inputTypeOf(a)) {
		case "checkbox":
			return raw === true;
		case "text":
		case "date":
			return typeof raw === "string" ? raw : "";
		case "number":
			return typeof raw === "number" ? String(raw) : "";
		case "measurement":
			return { value: d.value != null ? String(d.value) : "", unit: d.unit ?? firstUnit(a) };
		case "dimensions":
			return { width: d.width != null ? String(d.width) : "", height: d.height != null ? String(d.height) : "", unit: d.unit ?? firstUnit(a) };
		case "file":
			return [];
		default:
			return undefined;
	}
}

/** What the server gets for a field; undefined when it isn't answered */
export function toAnswer(a: ProductAttribute, v: FieldDraft): unknown {
	switch (inputTypeOf(a)) {
		case "checkbox":
			return v === true;
		case "text":
		case "date":
			return typeof v === "string" && v.trim() ? v.trim() : undefined;
		case "number":
			return typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : undefined;
		case "measurement": {
			const m = v as { value: string; unit: LengthUnit } | undefined;
			return m && Number(m.value) > 0 ? { value: Number(m.value), unit: m.unit } : undefined;
		}
		case "dimensions": {
			const m = v as { width: string; height: string; unit: LengthUnit } | undefined;
			return m && Number(m.width) > 0 && Number(m.height) > 0 ? { width: Number(m.width), height: Number(m.height), unit: m.unit } : undefined;
		}
		case "file": {
			const files = (v as FileInfo[] | undefined) ?? [];
			return files.length ? files.map((f) => ({ url: f.url, name: f.name, ...(f.size && { size: f.size }), ...(f.type && { type: f.type }) })) : undefined;
		}
	}
	return undefined;
}

/** For visibility checks: the same shape the server compares (lengths in mm) */
export function answerForConditions(a: ProductAttribute, v: FieldDraft): unknown {
	const ans = toAnswer(a, v);
	if (ans && inputTypeOf(a) === "measurement") {
		const m = ans as { value: number; unit: LengthUnit };
		return { ...m, mm: toMm(m.value, m.unit) };
	}
	return ans;
}

/** A short line for the order summary */
export function answerSummary(a: ProductAttribute, v: FieldDraft): string | null {
	const ans = toAnswer(a, v);
	if (ans === undefined) return null;
	switch (inputTypeOf(a)) {
		case "checkbox":
			return ans ? a.name : null;
		case "measurement": {
			const m = ans as { value: number; unit: LengthUnit };
			return `${a.name}: ${m.value} ${m.unit}`;
		}
		case "dimensions": {
			const m = ans as { width: number; height: number; unit: LengthUnit };
			return `${a.name}: ${m.width} × ${m.height} ${m.unit}`;
		}
		case "file": {
			const n = (ans as unknown[]).length;
			return `${a.name}: ${n} file${n === 1 ? "" : "s"}`;
		}
		case "text": {
			const t = ans as string;
			return `${a.name}: ${t.length > 40 ? t.slice(0, 40) + "…" : t}`;
		}
		default:
			return `${a.name}: ${String(ans)}`;
	}
}

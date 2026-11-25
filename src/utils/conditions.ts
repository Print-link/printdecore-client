/**
 * When a service's field is shown: the same declarative conditions the server
 * checks (printdecore-backend/src/features/pricing/v2/conditions.ts). The
 * browser only uses this to hide fields; the server decides what's priced.
 *
 *   { all: [...] } | { any: [...] } | { not: c } | { field, op, value }
 */

export type ConditionOp = "eq" | "neq" | "in" | "nin" | "gt" | "gte" | "lt" | "lte" | "set" | "unset";

export type Condition =
	| { all: Condition[] }
	| { any: Condition[] }
	| { not: Condition }
	| { field: string; op: ConditionOp; value?: unknown };

const isScalar = (v: unknown) => typeof v === "string" || typeof v === "number" || typeof v === "boolean";
const isSet = (v: unknown) => v !== undefined && v !== null && v !== "" && v !== false && !(Array.isArray(v) && v.length === 0);
const same = (a: unknown, b: unknown) => a === b || (isScalar(a) && isScalar(b) && String(a) === String(b));
const asNumber = (v: unknown): number | undefined => {
	if (typeof v === "number" && Number.isFinite(v)) return v;
	if (v && typeof v === "object" && typeof (v as { mm?: unknown }).mm === "number") return (v as { mm: number }).mm;
	return undefined;
};

export function evaluateCondition(c: Condition | null | undefined, answers: Record<string, unknown>): boolean {
	if (!c) return true;
	if ("all" in c) return c.all.every((x) => evaluateCondition(x, answers));
	if ("any" in c) return c.any.some((x) => evaluateCondition(x, answers));
	if ("not" in c) return !evaluateCondition(c.not, answers);

	const v = answers[c.field];
	const list = Array.isArray(v) ? v : [v];
	switch (c.op) {
		case "set":
			return isSet(v);
		case "unset":
			return !isSet(v);
		case "eq":
			return list.some((x) => same(x, c.value));
		case "neq":
			return !list.some((x) => same(x, c.value));
		case "in":
			return list.some((x) => (c.value as unknown[]).some((y) => same(x, y)));
		case "nin":
			return !list.some((x) => (c.value as unknown[]).some((y) => same(x, y)));
		default: {
			const n = asNumber(v);
			const ref = c.value as number;
			if (n === undefined) return false;
			return c.op === "gt" ? n > ref : c.op === "gte" ? n >= ref : c.op === "lt" ? n < ref : n <= ref;
		}
	}
}

import { useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Check, Paperclip, SpinnerGap, X } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { uploadPrintFiles, type FileInfo } from "../../services/orderApi";
import { inputTypeOf, type LengthUnit, type ProductAttribute } from "../../services/pricingApi";
import { firstUnit, unitsFor, type FieldDraft } from "./serviceFields";

const inputClass =
	"w-full h-11 px-3 text-base bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink";
const fieldLabel = "block mb-1.5 text-sm text-ink-2";

const addDays = (days: number) => {
	const d = new Date();
	d.setUTCDate(d.getUTCDate() + days);
	return d.toISOString().slice(0, 10);
};

const UnitToggle = ({ units, unit, onChange, label }: { units: LengthUnit[]; unit: LengthUnit; onChange: (u: LengthUnit) => void; label: string }) =>
	units.length > 1 ? (
		<div className="inline-flex p-0.5 mb-3 rounded-lg bg-fill" role="group" aria-label={label}>
			{units.map((u) => (
				<button
					type="button"
					key={u}
					onClick={() => onChange(u)}
					aria-pressed={unit === u}
					className={`h-8 px-3 text-sm rounded-md ${unit === u ? "bg-surface text-ink font-semibold ring-1 ring-line" : "text-ink-2"}`}
				>
					{u}
				</button>
			))}
		</div>
	) : null;

interface Props {
	attr: ProductAttribute;
	value: FieldDraft;
	onChange: (v: FieldDraft) => void;
	onUploadingChange?: (uploading: boolean) => void;
}

/** The control for one input field (its title and errors are drawn by the caller) */
export const ServiceFieldInput = ({ attr, value, onChange, onUploadingChange }: Props) => {
	const { user } = useAuth();
	const location = useLocation();
	const fileInput = useRef<HTMLInputElement>(null);
	const [uploading, setUploading] = useState(false);
	const c = attr.config ?? {};
	const type = inputTypeOf(attr);
	const id = `field-${attr.key}`;

	switch (type) {
		case "checkbox": {
			const on = value === true;
			return (
				<button
					type="button"
					role="checkbox"
					aria-checked={on}
					onClick={() => onChange(!on)}
					className="tap w-full flex items-center gap-3 min-h-12 py-3 border-y border-line text-left"
				>
					<span className={`flex-1 text-base text-ink ${on ? "font-semibold" : ""}`}>{attr.helpText || `Yes, ${attr.name.toLowerCase()}`}</span>
					<span className={`w-5 h-5 shrink-0 rounded-md flex items-center justify-center ${on ? "bg-ink text-page" : "border-[1.5px] border-line-strong"}`}>
						{on && <Check size={12} weight="bold" />}
					</span>
				</button>
			);
		}
		case "text":
			return c.multiline ? (
				<textarea
					id={id}
					className={`${inputClass} h-auto py-3`}
					rows={3}
					maxLength={c.maxLength ?? 500}
					placeholder={c.placeholder}
					value={(value as string) ?? ""}
					onChange={(e) => onChange(e.target.value)}
				/>
			) : (
				<input
					id={id}
					className={inputClass}
					maxLength={c.maxLength ?? 500}
					placeholder={c.placeholder}
					value={(value as string) ?? ""}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "number":
			return (
				<input
					id={id}
					className={`${inputClass} num`}
					inputMode={c.integer ? "numeric" : "decimal"}
					placeholder={c.placeholder ?? [c.min !== undefined && `From ${c.min}`, c.max !== undefined && `up to ${c.max}`].filter(Boolean).join(" ")}
					value={(value as string) ?? ""}
					onChange={(e) => onChange(e.target.value.replace(c.integer ? /[^0-9-]/g : /[^0-9.-]/g, ""))}
				/>
			);
		case "date":
			return (
				<input
					id={id}
					type="date"
					className={inputClass}
					min={c.minDaysAhead !== undefined ? addDays(c.minDaysAhead) : undefined}
					max={c.maxDaysAhead !== undefined ? addDays(c.maxDaysAhead) : undefined}
					value={(value as string) ?? ""}
					onChange={(e) => onChange(e.target.value)}
				/>
			);
		case "measurement": {
			const m = (value as { value: string; unit: LengthUnit }) ?? { value: "", unit: firstUnit(attr) };
			return (
				<div>
					<UnitToggle units={unitsFor(attr)} unit={m.unit} onChange={(u) => onChange({ ...m, unit: u })} label={`${attr.name} unit`} />
					<label className="block">
						<span className={fieldLabel}>
							{attr.name} ({m.unit})
						</span>
						<input className={`${inputClass} num`} inputMode="decimal" value={m.value} onChange={(e) => onChange({ ...m, value: e.target.value.replace(/[^0-9.]/g, "") })} />
					</label>
				</div>
			);
		}
		case "dimensions": {
			const m = (value as { width: string; height: string; unit: LengthUnit }) ?? { width: "", height: "", unit: firstUnit(attr) };
			return (
				<div>
					<UnitToggle units={unitsFor(attr)} unit={m.unit} onChange={(u) => onChange({ ...m, unit: u })} label={`${attr.name} unit`} />
					<div className="grid grid-cols-2 gap-3">
						<label className="block">
							<span className={fieldLabel}>Width ({m.unit})</span>
							<input className={`${inputClass} num`} inputMode="decimal" value={m.width} onChange={(e) => onChange({ ...m, width: e.target.value.replace(/[^0-9.]/g, "") })} />
						</label>
						<label className="block">
							<span className={fieldLabel}>Height ({m.unit})</span>
							<input className={`${inputClass} num`} inputMode="decimal" value={m.height} onChange={(e) => onChange({ ...m, height: e.target.value.replace(/[^0-9.]/g, "") })} />
						</label>
					</div>
				</div>
			);
		}
		case "file": {
			const files = (value as FileInfo[]) ?? [];
			const max = c.maxFiles ?? 5;
			const accept = c.accept?.length ? c.accept.map((e) => `.${e}`).join(",") : undefined;
			const pick = async (list: FileList | null) => {
				if (!list?.length) return;
				const chosen = Array.from(list).slice(0, Math.max(0, max - files.length));
				if (!chosen.length) {
					toast.info(`Up to ${max} file${max === 1 ? "" : "s"} here`);
					return;
				}
				setUploading(true);
				onUploadingChange?.(true);
				try {
					onChange([...files, ...(await uploadPrintFiles(chosen))]);
				} catch (err) {
					toast.error(err instanceof Error ? err.message : "Couldn't upload your files");
				} finally {
					setUploading(false);
					onUploadingChange?.(false);
					if (fileInput.current) fileInput.current.value = "";
				}
			};
			return (
				<div>
					{files.length > 0 && (
						<ul className="mb-2 space-y-1.5">
							{files.map((f, i) => (
								<li key={f.publicId || i} className="flex items-center gap-2 h-11 px-3 rounded-xl bg-fill text-sm">
									<Paperclip size={16} className="text-ink-2 shrink-0" />
									<span className="flex-1 truncate text-ink">{f.name}</span>
									<button type="button" onClick={() => onChange(files.filter((_, j) => j !== i))} className="tap p-1.5 -mr-1 text-ink-3 hover:text-bad" aria-label={`Remove ${f.name}`}>
										<X size={14} />
									</button>
								</li>
							))}
						</ul>
					)}
					{!user ? (
						<p className="text-sm text-ink-2">
							<Link to={`/login?returnUrl=${encodeURIComponent(location.pathname + location.search)}`} className="font-semibold text-ink underline underline-offset-2">
								Sign in
							</Link>{" "}
							to add files.
						</p>
					) : files.length < max ? (
						<>
							<button
								type="button"
								onClick={() => fileInput.current?.click()}
								disabled={uploading}
								className="tap w-full h-12 flex items-center justify-center gap-2 text-sm font-semibold rounded-xl border border-dashed border-line-strong text-ink"
							>
								{uploading ? <SpinnerGap size={16} className="animate-spin" /> : <Paperclip size={16} />}
								{uploading ? "Uploading…" : c.accept?.length ? `Add ${c.accept.join(", ")} file` : "Add file"}
							</button>
							<input ref={fileInput} type="file" multiple={max > 1} accept={accept} className="hidden" onChange={(e) => pick(e.target.files)} />
						</>
					) : null}
				</div>
			);
		}
		default:
			return null;
	}
};

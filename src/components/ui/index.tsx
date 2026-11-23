/**
 * Printdecore UI kit — flat, hairline-led, one amber action per view.
 * Tokens live in index.css (bg-page, bg-fill, text-ink, border-line, bg-brand…).
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { forwardRef } from "react";
import { CaretRight } from "@phosphor-icons/react";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");

/* ─── Button ─── */
type Variant = "primary" | "secondary" | "dark" | "ghost" | "danger";
type Size = "lg" | "md" | "sm";
const VARIANT: Record<Variant, string> = {
	primary: "bg-brand text-black hover:bg-brand-press",
	secondary: "bg-fill text-ink hover:bg-fill-press",
	dark: "bg-ink text-page hover:opacity-90",
	ghost: "bg-transparent text-ink hover:bg-fill",
	danger: "bg-bad-tint text-bad hover:opacity-90",
};
const SIZE: Record<Size, string> = {
	lg: "h-12 px-5 text-base rounded-xl gap-2",
	md: "h-10 px-4 text-sm rounded-xl gap-2",
	sm: "h-8 px-3 text-sm rounded-lg gap-1.5",
};
export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; block?: boolean; icon?: ReactNode; loading?: boolean };
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ variant = "primary", size = "lg", block, icon, loading, className, children, disabled, ...rest }, ref) => (
	<button
		ref={ref}
		disabled={disabled || loading}
		className={cx("tap inline-flex items-center justify-center font-semibold select-none whitespace-nowrap", VARIANT[variant], SIZE[size], block && "w-full", className)}
		{...rest}
	>
		{loading ? <Spinner /> : icon}
		{children}
	</button>
));
Button.displayName = "Button";

export const IconButton = ({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) => (
	<button aria-label={label} title={label} className={cx("tap inline-flex items-center justify-center w-10 h-10 rounded-full text-ink hover:bg-fill", className)} {...rest}>
		{children}
	</button>
);

export const Spinner = ({ className }: { className?: string }) => (
	<span className={cx("inline-block w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin", className)} aria-hidden />
);

/* ─── Section header: bold title, optional quiet action ─── */
export const SectionHeader = ({ title, sub, action, onAction, className }: { title: ReactNode; sub?: ReactNode; action?: string; onAction?: () => void; className?: string }) => (
	<div className={cx("flex items-end justify-between gap-3 mb-2", className)}>
		<div className="min-w-0">
			<h2 className="text-xl font-bold title-tight text-ink truncate">{title}</h2>
			{sub && <p className="text-sm text-ink-2 truncate">{sub}</p>}
		</div>
		{action && (
			<button onClick={onAction} className="tap shrink-0 -mr-2 px-2 py-1 text-sm font-semibold text-ink rounded-lg hover:bg-fill">
				{action}
			</button>
		)}
	</div>
);

/** Small grey caps label above a group (settings-style) */
export const GroupLabel = ({ children, className }: { children: ReactNode; className?: string }) => (
	<p className={cx("px-4 md:px-0 pt-6 pb-2 text-xs font-semibold text-ink-3 uppercase tracking-wide", className)}>{children}</p>
);

/* ─── List row: leading media, title/sub, trailing meta, hairline below ─── */
export const ListRow = ({
	leading,
	title,
	sub,
	meta,
	trailing,
	onClick,
	chevron = !!onClick,
	divider = true,
	className,
}: {
	leading?: ReactNode;
	title: ReactNode;
	sub?: ReactNode;
	meta?: ReactNode;
	trailing?: ReactNode;
	onClick?: () => void;
	chevron?: boolean;
	divider?: boolean;
	className?: string;
}) => {
	const body = (
		<>
			{leading && <span className="shrink-0">{leading}</span>}
			<span className={cx("flex-1 min-w-0 flex items-center gap-3 self-stretch py-3", divider && "border-b border-line")}>
				<span className="flex-1 min-w-0">
					<span className="block text-base font-semibold text-ink truncate">{title}</span>
					{sub && <span className="block text-sm text-ink-2 truncate">{sub}</span>}
					{meta && <span className="block mt-0.5 text-xs text-ink-3">{meta}</span>}
				</span>
				{trailing}
				{chevron && <CaretRight size={16} className="shrink-0 text-ink-3" />}
			</span>
		</>
	);
	const cls = cx("w-full flex items-center gap-3 text-left min-h-14", className);
	return onClick ? (
		<button type="button" onClick={onClick} className={cx("tap", cls)}>
			{body}
		</button>
	) : (
		<div className={cls}>{body}</div>
	);
};

/** Square thumbnail with a hairline ring — images never float on shadows */
export const Thumb = ({ src, alt = "", size = 56, children, className }: { src?: string | null; alt?: string; size?: number; children?: ReactNode; className?: string }) => (
	<span
		className={cx("relative inline-flex items-center justify-center overflow-hidden rounded-lg bg-fill text-ink-2 ring-1 ring-inset ring-line", className)}
		style={{ width: size, height: size }}
	>
		{src ? <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" /> : children}
	</span>
);

/* ─── Chip: filter / choice ─── */
export const Chip = ({ active, children, className, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) => (
	<button
		type="button"
		aria-pressed={active}
		className={cx(
			"tap shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg text-sm font-medium whitespace-nowrap",
			active ? "bg-ink text-page" : "bg-fill text-ink hover:bg-fill-press",
			className
		)}
		{...rest}
	>
		{children}
	</button>
);

/* ─── Tag: tiny status label ─── */
type Tone = "neutral" | "brand" | "ok" | "bad";
const TONE: Record<Tone, string> = {
	neutral: "bg-fill text-ink-2",
	brand: "bg-brand-tint text-brand-ink",
	ok: "bg-ok-tint text-ok",
	bad: "bg-bad-tint text-bad",
};
export const Tag = ({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) => (
	<span className={cx("inline-flex items-center gap-1 h-5 px-1.5 rounded-md text-xs font-semibold whitespace-nowrap", TONE[tone], className)}>{children}</span>
);

/* ─── Inputs ─── */
export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { leading?: ReactNode; trailing?: ReactNode; wrapClassName?: string }>(
	({ leading, trailing, className, wrapClassName, ...rest }, ref) => (
		<label className={cx("flex items-center gap-2 h-11 px-3 rounded-xl bg-fill text-ink border border-transparent focus-within:border-ink transition-colors", wrapClassName)}>
			{leading && <span className="shrink-0 text-ink-3">{leading}</span>}
			<input ref={ref} className={cx("flex-1 min-w-0 h-full bg-transparent outline-none placeholder:text-ink-3 text-base", className)} {...rest} />
			{trailing}
		</label>
	)
);
Field.displayName = "Field";

/* ─── Group: a quiet filled block of rows (Me sheet, settings) ─── */
export const Group = ({ children, className }: { children: ReactNode; className?: string }) => (
	<div className={cx("rounded-xl bg-fill overflow-hidden", className)}>{children}</div>
);

/* ─── Panel: hairline box for a bounded thing (summary, receipt) ─── */
export const Panel = ({ children, className }: { children: ReactNode; className?: string }) => (
	<div className={cx("rounded-xl border border-line bg-surface", className)}>{children}</div>
);

/* ─── Key/value line, numbers aligned ─── */
export const KV = ({ k, v, strong, className }: { k: ReactNode; v: ReactNode; strong?: boolean; className?: string }) => (
	<div className={cx("flex items-baseline justify-between gap-4 py-1.5", className)}>
		<span className={cx("text-sm", strong ? "font-semibold text-ink" : "text-ink-2")}>{k}</span>
		<span className={cx("num text-right", strong ? "text-base font-bold text-ink" : "text-sm text-ink")}>{v}</span>
	</div>
);

/* ─── Empty state ─── */
export const EmptyState = ({ icon, title, body, action, className }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode; className?: string }) => (
	<div className={cx("flex flex-col items-center text-center px-6 py-14", className)}>
		{icon && <span className="mb-4 inline-flex w-14 h-14 items-center justify-center rounded-xl bg-fill text-ink-2">{icon}</span>}
		<p className="text-lg font-bold text-ink">{title}</p>
		{body && <p className="mt-1 max-w-xs text-sm text-ink-2">{body}</p>}
		{action && <div className="mt-5">{action}</div>}
	</div>
);

/* ─── Skeleton ─── */
export const Skeleton = ({ className }: { className?: string }) => <span className={cx("block rounded-lg bg-fill animate-pulse", className)} aria-hidden />;

export const RowSkeleton = ({ rows = 4, thumb = 56 }: { rows?: number; thumb?: number }) => (
	<div role="status" aria-label="Loading">
		{Array.from({ length: rows }).map((_, i) => (
			<div key={i} className="flex items-center gap-3 py-3 border-b border-line">
				<span className="shrink-0 rounded-lg bg-fill animate-pulse" style={{ width: thumb, height: thumb }} />
				<span className="flex-1 space-y-2">
					<Skeleton className="h-4 w-2/3" />
					<Skeleton className="h-3 w-1/3" />
				</span>
			</div>
		))}
	</div>
);

/* ─── Sheet: bottom sheet on phones, centred dialog from tablet up ─── */
export const Sheet = ({ open, onClose, title, children, label }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; label?: string }) => {
	if (!open) return null;
	return (
		<div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
			<div className="absolute inset-0 bg-black/50" onClick={onClose} />
			<div className="sheet-up relative w-full md:max-w-md max-h-[90dvh] overflow-y-auto rounded-t-3xl md:rounded-3xl bg-surface pb-safe">
				<div className="sticky top-0 bg-surface pt-2.5 pb-1 flex justify-center md:hidden">
					<span className="w-9 h-1 rounded-full bg-line-strong" />
				</div>
				{title && <h2 className="px-5 pt-2 pb-3 text-xl font-bold title-tight text-ink">{title}</h2>}
				{children}
			</div>
		</div>
	);
};

/* ─── Sticky action bar: sits above the tab bar on phones ─── */
export const ActionBar = ({ children, className, aboveTabs = true }: { children: ReactNode; className?: string; aboveTabs?: boolean }) => (
	<>
		<div className="h-20 md:hidden" aria-hidden />
		<div
			className={cx(
				"fixed inset-x-0 z-30 md:sticky md:bottom-0 md:mt-6 bg-surface border-t border-line md:border md:rounded-xl",
				aboveTabs ? "bottom-tabbar md:bottom-0" : "bottom-0 pb-safe",
				className
			)}
		>
			<div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">{children}</div>
		</div>
	</>
);

/** Total on the left of an action bar */
export const BarTotal = ({ label = "Total", value }: { label?: string; value: ReactNode }) => (
	<div className="flex-1 min-w-0">
		<p className="text-xs text-ink-2">{label}</p>
		<p className="num text-lg font-bold text-ink truncate">{value}</p>
	</div>
);


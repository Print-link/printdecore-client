import { useNavigate } from "react-router-dom";
import { ArrowRight, ChatCircleDots, Receipt, Storefront } from "@phosphor-icons/react";
import { PrintyAvatar } from "./PrintyAvatar";

const IDEAS = [
	{ label: "Branded bags", text: "I need branded bags — " },
	{ label: "Mugs or T-shirts", text: "I'd like custom mugs or T-shirts: " },
	{ label: "A large banner", text: "I need a large banner for " },
];

const STEPS = [
	{ icon: ChatCircleDots, label: "You describe it" },
	{ icon: Receipt, label: "Printy writes it up" },
	{ icon: Storefront, label: "The shop sends a price" },
];

/**
 * A shop's own assistant, on its page: for anything the shop doesn't list.
 * Light with a moving gold edge, so it reads differently from Home's dark
 * card, and shows the hand-off: Printy takes the brief, the shop prices it.
 */
export const ShopAssistantCard = ({ shopId, shopName, shopImage }: { shopId: string; shopName: string; shopImage?: string | null }) => {
	const navigate = useNavigate();
	const open = (idea?: string) => navigate(`/home/shops/${shopId}/assistant`, idea ? { state: { prefill: idea } } : undefined);

	return (
		<div className="relative mt-5 rounded-3xl p-[1.5px] overflow-hidden shadow-[0_12px_40px_-18px_rgba(217,119,6,0.55)]">
			{/* The moving gold edge */}
			<span
				className="printy-spin pointer-events-none absolute -inset-[60%] [background:conic-gradient(from_0deg,#fbbf24,#fde68a_25%,transparent_40%,transparent_60%,#f59e0b_80%,#fbbf24)]"
				aria-hidden
			/>
			<div
				role="button"
				tabIndex={0}
				onClick={() => open()}
				onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), open())}
				aria-label={`Ask ${shopName} for a quote with the print assistant`}
				className="tap relative rounded-[22px] bg-white dark:bg-[#18160f] p-4 sm:p-5 cursor-pointer overflow-hidden"
			>
				<span className="pointer-events-none absolute -bottom-20 -left-16 w-56 h-56 rounded-full bg-amber-200/40 dark:bg-amber-500/10 blur-3xl" aria-hidden />

				<div className="relative flex items-center gap-4">
					{/* Hand-off: Printy → brief → shop */}
					<div className="relative shrink-0 flex items-center">
						<span className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-400/10 ring-1 ring-amber-200 dark:ring-amber-400/20 flex items-center justify-center">
							<PrintyAvatar size={44} />
						</span>
						<span className="relative w-8 sm:w-10 h-px mx-1 border-t-2 border-dashed border-amber-300 dark:border-amber-500/40" aria-hidden>
							<span className="printy-handoff absolute -top-[9px] left-0 w-4 h-4 rounded bg-white dark:bg-[#2a2a2a] shadow ring-1 ring-amber-300 flex items-center justify-center">
								<span className="w-2 h-0.5 rounded bg-[#fbbf24]" />
							</span>
						</span>
						<span className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 ring-1 ring-gray-200 dark:ring-gray-700 flex items-center justify-center">
							{shopImage ? <img src={shopImage} alt="" className="w-full h-full object-cover" /> : <Storefront size={24} className="text-[#d97706]" />}
						</span>
					</div>
					<div className="min-w-0 hidden sm:block">
						<p className="text-[11px] font-bold uppercase tracking-wider text-[#d97706]">Custom quote · Print Assistant</p>
						<p className="mt-0.5 text-lg font-black leading-tight text-gray-900 dark:text-white">Need something {shopName} doesn't list?</p>
					</div>
				</div>

				<div className="relative sm:hidden mt-3">
					<p className="text-[11px] font-bold uppercase tracking-wider text-[#d97706]">Custom quote · Print Assistant</p>
					<p className="mt-0.5 text-lg font-black leading-tight text-gray-900 dark:text-white">Need something {shopName} doesn't list?</p>
				</div>
				<p className="relative mt-1.5 text-sm text-gray-600 dark:text-gray-400">
					Tell Printy in your own words or send a photo. It writes up the brief and {shopName} sends you a price — nothing is charged until you accept.
				</p>

				<ol className="relative mt-3 grid grid-cols-3 gap-1.5">
					{STEPS.map(({ icon: Icon, label }, i) => (
						<li key={label} className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 dark:bg-white/[0.03] px-1.5 py-2 text-center">
							<span className="relative w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-400/15 text-[#b45309] dark:text-amber-300 flex items-center justify-center">
								<Icon size={14} weight="bold" />
								<span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gray-900 dark:bg-white text-[8px] font-black text-white dark:text-black flex items-center justify-center">{i + 1}</span>
							</span>
							<span className="text-[11px] leading-tight font-semibold text-gray-700 dark:text-gray-300">{label}</span>
						</li>
					))}
				</ol>

				<div className="relative mt-4 flex flex-col sm:flex-row sm:items-center gap-2.5">
					<span className="order-2 sm:order-1 inline-flex justify-center items-center gap-2 rounded-xl bg-gray-900 dark:bg-[#fbbf24] px-4 py-2.5 text-sm font-bold text-white dark:text-black">
						Ask {shopName} for a quote <ArrowRight size={15} weight="bold" className="printy-nudge" />
					</span>
					<div className="order-1 sm:order-2 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-1.5 overflow-x-auto hide-scrollbar">
						{IDEAS.map((idea) => (
							<button
								key={idea.label}
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									open(idea.text);
								}}
								className="tap shrink-0 whitespace-nowrap rounded-full border border-amber-200 dark:border-amber-400/20 bg-amber-50/70 dark:bg-amber-400/5 px-3 py-1.5 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:border-[#fbbf24]"
							>
								{idea.label}
							</button>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

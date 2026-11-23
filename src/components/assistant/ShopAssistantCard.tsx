import { useNavigate } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";
import { PrintyAvatar } from "./PrintyAvatar";
import { Chip } from "../ui";

const IDEAS = [
	{ label: "Branded bags", text: "I need branded bags — " },
	{ label: "Mugs or T-shirts", text: "I'd like custom mugs or T-shirts: " },
	{ label: "A large banner", text: "I need a large banner for " },
];

/**
 * A shop's own assistant, on its page: for anything the shop doesn't list.
 * Printy takes the brief, the shop sends a price; nothing is charged until accepted.
 */
export const ShopAssistantCard = ({ shopId, shopName }: { shopId: string; shopName: string; shopImage?: string | null }) => {
	const navigate = useNavigate();
	const open = (idea?: string) => navigate(`/home/shops/${shopId}/assistant`, idea ? { state: { prefill: idea } } : undefined);

	return (
		<section className="mt-6 rounded-xl border border-line bg-surface" aria-label={`Ask ${shopName} for a quote`}>
			<button type="button" onClick={() => open()} className="tap w-full flex items-center gap-3 p-3 text-left">
				<span className="w-11 h-11 shrink-0 rounded-lg bg-fill flex items-center justify-center">
					<PrintyAvatar size={32} />
				</span>
				<span className="flex-1 min-w-0">
					<span className="block text-base font-semibold text-ink">Need something they don't list?</span>
					<span className="block text-sm text-ink-2">Describe it and {shopName} sends a price. Nothing is charged until you accept.</span>
				</span>
				<CaretRight size={16} className="shrink-0 text-ink-3" />
			</button>
			<div className="flex gap-2 px-3 pb-3 overflow-x-auto hide-scrollbar">
				{IDEAS.map((idea) => (
					<Chip key={idea.label} onClick={() => open(idea.text)}>
						{idea.label}
					</Chip>
				))}
			</div>
		</section>
	);
};

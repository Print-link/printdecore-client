import {
	Tag,
	StackSimple,
	Ruler,
	HashStraight,
} from "@phosphor-icons/react";
import type { OrderItem } from "../../services/orderApi";
import { toOrderFiles } from "../../utils/files";
import { FileList } from "./FileList";

interface OrderItemCardProps {
	item: OrderItem;
	index: number;
}

export const OrderItemCard = ({ item, index }: OrderItemCardProps) => {
	const filePages = item.options?.filePages;
	const hasFilePages = typeof filePages === 'number' && filePages > 0;

	const selectedOptions = item.options?.selectedOptions as string[] | undefined;
	const selectedCustomSpecs = item.options?.selectedCustomSpecs as string[] | undefined;
	const agentService = item.agentService;

	const pricingOptions = agentService?.pricingConfig?.options || [];
	const customSpecs = agentService?.pricingConfig?.customSpecifications || [];

	const selectedOptionNames = selectedOptions
		?.map(optId => {
			const option = pricingOptions.find(o => o.id === optId);
			return option ? { id: optId, name: option.name, modifier: option.priceModifier, modifierType: option.modifierType } : null;
		})
		.filter((opt): opt is NonNullable<typeof opt> => opt !== null) || [];

	const selectedCustomSpecNames = selectedCustomSpecs
		?.map(specId => {
			const spec = customSpecs.find(s => s.id === specId);
			return spec ? { id: specId, name: spec.name, modifier: spec.priceModifier, modifierType: spec.modifierType } : null;
		})
		.filter((spec): spec is NonNullable<typeof spec> => spec !== null) || [];

	const hasLegacyOptions = item.options?.frontBack || item.options?.color || item.options?.printCut;
	const hasFlexibleOptions = selectedOptionNames.length > 0 || selectedCustomSpecNames.length > 0;

	return (
		<div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 hover:bg-gray-50 transition-colors duration-200">
			{/* Header Row */}
			<div className="flex items-start justify-between mb-3">
				<div className="flex items-center gap-2.5">
					<div className="w-7 h-7 rounded-lg bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 flex items-center justify-center">
						<span className="text-xs font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
					</div>
					<div>
						<h4 className="text-sm font-semibold text-gray-900 dark:text-white">
							Item {index + 1}
						</h4>
					</div>
				</div>
				<div className="text-right">
					<p className="text-base font-bold text-gray-900 dark:text-white">
						GHS {item.calculatedPrice.toFixed(2)}
					</p>
				</div>
			</div>

			{item.quote?.summary && item.quote.summary.length > 0 && (
				<p className="text-xs text-gray-600 dark:text-gray-400 mb-3">{item.quote.summary.join(" · ")}</p>
			)}

			{/* Details Grid */}
			<div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-3">
				{item.width && item.height && (
					<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-800">
						<Ruler size={14} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<span>{item.width} x {item.height} {item.measurementUnit}</span>
					</div>
				)}
				<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-800">
					<HashStraight size={14} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
					<span>Qty: {item.quantity}</span>
				</div>
				{hasFilePages && (
					<div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-800">
						<StackSimple size={14} weight="duotone" className="text-gray-400 dark:text-gray-500 shrink-0" />
						<span>{filePages} page{filePages !== 1 ? "s" : ""}</span>
					</div>
				)}
			</div>

			{/* Flexible Pricing Options & Custom Specs */}
			{hasFlexibleOptions && (
				<div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
					<div className="flex items-center gap-2 mb-2.5">
						<Tag size={14} weight="duotone" className="text-gray-400 dark:text-gray-500" />
						<span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
							Modifiers
						</span>
					</div>
					<div className="space-y-2.5">
						{selectedOptionNames.length > 0 && (
							<div>
								<div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Options</div>
								<div className="flex flex-wrap gap-1.5">
									{selectedOptionNames.map((opt) => (
										<span
											key={opt.id}
											className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg"
										>
											{opt.name}
											{opt.modifier > 0 && (
												<span className="text-emerald-600 font-semibold">
													+GHS {opt.modifier.toFixed(2)}
												</span>
											)}
										</span>
									))}
								</div>
							</div>
						)}

						{selectedCustomSpecNames.length > 0 && (
							<div>
								<div className="text-[11px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5">Add-ons</div>
								<div className="flex flex-wrap gap-1.5">
									{selectedCustomSpecNames.map((spec) => (
										<span
											key={spec.id}
											className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-violet-700 bg-violet-50 border border-violet-200 rounded-lg"
										>
											{spec.name}
											{spec.modifier > 0 && (
												<span className="text-violet-600 font-semibold">
													+GHS {spec.modifier.toFixed(2)}
												</span>
											)}
										</span>
									))}
								</div>
							</div>
						)}
					</div>
				</div>
			)}

			{/* Legacy Options */}
			{hasLegacyOptions && !hasFlexibleOptions && (
				<div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
					{item.options?.frontBack && (
						<span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg">
							Front & Back
						</span>
					)}
					{item.options?.color && (
						<span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg">
							Color
						</span>
					)}
					{item.options?.printCut && (
						<span className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg">
							Print & Cut
						</span>
					)}
				</div>
			)}

			{/* Files */}
			{item.options?.files && item.options.files.length > 0 && (
				<div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-gray-700/60">
					<FileList files={toOrderFiles(item.options.files)} title="Your files" />
				</div>
			)}
		</div>
	);
};

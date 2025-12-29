import { FileText, Tag } from "lucide-react";
import type { OrderItem, FileInfo } from "../../services/orderApi";
import { formatFileSize } from "../../utils/orderUtils";

interface OrderItemCardProps {
	item: OrderItem;
	index: number;
}

export const OrderItemCard = ({ item, index }: OrderItemCardProps) => {
	const filePages = item.options?.filePages;
	const hasFilePages = typeof filePages === 'number' && filePages > 0;
	
	// Get selected options and custom specs from options (flexible pricing)
	const selectedOptions = item.options?.selectedOptions as string[] | undefined;
	const selectedCustomSpecs = item.options?.selectedCustomSpecs as string[] | undefined;
	const agentService = item.agentService;
	
	// Get option and custom spec names from agentService pricing config
	const pricingOptions = agentService?.pricingConfig?.options || [];
	const customSpecs = agentService?.pricingConfig?.customSpecifications || [];
	
	// Map selected option IDs to names
	const selectedOptionNames = selectedOptions
		?.map(optId => {
			const option = pricingOptions.find(o => o.id === optId);
			return option ? { id: optId, name: option.name, modifier: option.priceModifier, modifierType: option.modifierType } : null;
		})
		.filter((opt): opt is NonNullable<typeof opt> => opt !== null) || [];
	
	// Map selected custom spec IDs to names
	const selectedCustomSpecNames = selectedCustomSpecs
		?.map(specId => {
			const spec = customSpecs.find(s => s.id === specId);
			return spec ? { id: specId, name: spec.name, modifier: spec.priceModifier, modifierType: spec.modifierType } : null;
		})
		.filter((spec): spec is NonNullable<typeof spec> => spec !== null) || [];
	
	// Legacy options (for backward compatibility)
	const hasLegacyOptions = item.options?.frontBack || item.options?.color || item.options?.printCut;
	const hasFlexibleOptions = selectedOptionNames.length > 0 || selectedCustomSpecNames.length > 0;
	// const hasAnyOptions = hasLegacyOptions || hasFlexibleOptions; // Removed unused variable

	return (
		<div className="border-2 border-gray-200 rounded-lg p-3">
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<h4 className="text-sm font-semibold text-gray-900 mb-1">
						Item {index + 1}
					</h4>
					<div className="space-y-1 text-xs text-gray-600">
						{item.width && item.height && (
							<div>
								Dimensions: {item.width} × {item.height} {item.measurementUnit}
							</div>
						)}
						<div>Quantity: {item.quantity}</div>
						{hasFilePages && (
							<div>PDF Pages: {filePages}</div>
						)}
					</div>
				</div>
				<div className="text-right">
					<p className="text-sm font-bold text-[#fbbf24]">
						GHS {item.calculatedPrice.toFixed(2)}
					</p>
				</div>
			</div>
			
			{/* Price Modifiers - Flexible Pricing Options & Custom Specs */}
			{hasFlexibleOptions && (
				<div className="mt-3 pt-3 border-t-2 border-[#fbbf24]/30">
					<div className="flex items-center gap-2 mb-2">
						<Tag className="w-4 h-4 text-[#fbbf24]" />
						<h5 className="text-xs font-bold text-gray-900 uppercase tracking-wide">
							Price Modifiers
						</h5>
					</div>
					<div className="space-y-2">
						{/* Selected Options */}
						{selectedOptionNames.length > 0 && (
							<div>
								<div className="text-xs font-semibold text-gray-700 mb-1.5">Options:</div>
								<div className="flex flex-wrap gap-2">
									{selectedOptionNames.map((opt) => (
										<span
											key={opt.id}
											className="px-3 py-1.5 text-xs font-bold text-[#fbbf24] bg-[#fbbf24]/10 border-2 border-[#fbbf24]/30 rounded-lg"
										>
											{opt.name}
											{opt.modifier > 0 && (
												<span className="ml-1.5 text-[#d97706]">
													(+GHS {opt.modifier.toFixed(2)})
												</span>
											)}
										</span>
									))}
								</div>
							</div>
						)}
						
						{/* Selected Custom Specs */}
						{selectedCustomSpecNames.length > 0 && (
							<div>
								<div className="text-xs font-semibold text-gray-700 mb-1.5">Add-ons:</div>
								<div className="flex flex-wrap gap-2">
									{selectedCustomSpecNames.map((spec) => (
										<span
											key={spec.id}
											className="px-3 py-1.5 text-xs font-bold text-[#fbbf24] bg-[#fbbf24]/10 border-2 border-[#fbbf24]/30 rounded-lg"
										>
											{spec.name}
											{spec.modifier > 0 && (
												<span className="ml-1.5 text-[#d97706]">
													(+GHS {spec.modifier.toFixed(2)})
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
			
			{/* Legacy Options (for backward compatibility) */}
			{hasLegacyOptions && !hasFlexibleOptions && (
				<div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
					{item.options?.frontBack && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Front & Back
						</span>
					)}
					{item.options?.color && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Color
						</span>
					)}
					{item.options?.printCut && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Print & Cut
						</span>
					)}
				</div>
			)}

			{/* Files */}
			{item.options?.files && item.options.files.length > 0 && (
				<div className="mt-2 pt-2 border-t border-gray-200">
					<p className="text-xs text-gray-500 mb-1">Files ({item.options.files.length}):</p>
					<div className="space-y-1">
						{item.options.files.map((file, fileIndex) => {
							const fileInfo = file as FileInfo;
							return (
								<div key={fileIndex} className="flex items-center gap-2 text-xs">
									<FileText className="w-3 h-3 text-gray-400" />
									<a
										href={fileInfo.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#fbbf24] hover:underline truncate"
									>
										{fileInfo.name || `File ${fileIndex + 1}`}
									</a>
									{fileInfo.bytes && (
										<span className="text-gray-500">
											({formatFileSize(fileInfo.bytes)})
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};


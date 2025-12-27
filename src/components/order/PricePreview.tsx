import { Calculator, Loader2 } from "lucide-react";
import type { AgentService, PriceCalculationResponse } from "../../services/orderApi";
import { hasFlexiblePricing } from "../../utils/pricingUtils";

interface PricePreviewProps {
	priceInfo: PriceCalculationResponse;
	agentService: AgentService;
	isPageBased: boolean;
	pdfPageCount?: number;
	quantity: number;
	options: {
		frontBack?: boolean;
		color?: boolean;
	};
	calculatingPrice: boolean;
	// New flexible pricing props
	selectedBaseConfigId?: string;
	selectedOptions?: string[];
	selectedCustomSpecs?: string[];
}

export const PricePreview = ({
	priceInfo,
	agentService,
	isPageBased,
	pdfPageCount,
	quantity,
	options,
	calculatingPrice,
	selectedBaseConfigId,
	selectedOptions,
	selectedCustomSpecs,
}: PricePreviewProps) => {
	const usesFlexiblePricing = hasFlexiblePricing(agentService);
	const breakdown = priceInfo.breakdown;

	return (
		<div className="bg-[#fbbf24]/5 border-2 border-[#fbbf24] rounded-lg p-4 sm:p-5 lg:p-6">
			<div className="flex items-center gap-2 mb-3 sm:mb-4">
				<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] flex-shrink-0" />
				<h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
					Price Summary
				</h4>
			</div>

			{/* New Flexible Pricing Breakdown */}
			{usesFlexiblePricing && breakdown && (
				<div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
					{breakdown.baseConfiguration && (
						<div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700">
							<span className="break-words">Base ({breakdown.baseConfiguration.name}):</span>
							<span className="font-medium whitespace-nowrap">
								GHS {breakdown.baseConfiguration.price.toFixed(2)}
							</span>
						</div>
					)}
					{breakdown.options && breakdown.options.length > 0 && (
						<div className="space-y-1.5 sm:space-y-1">
							<div className="text-xs font-medium text-gray-600 uppercase">Options:</div>
							{breakdown.options.map((option) => (
								<div key={option.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 ml-0 sm:ml-2">
									<span className="break-words">{option.name}:</span>
									<span className="font-medium text-[#fbbf24] whitespace-nowrap">
										+GHS {option.modifier.toFixed(2)}
									</span>
								</div>
							))}
						</div>
					)}
					{breakdown.customSpecs && breakdown.customSpecs.length > 0 && (
						<div className="space-y-1.5 sm:space-y-1">
							<div className="text-xs font-medium text-gray-600 uppercase">Add-ons:</div>
							{breakdown.customSpecs.map((spec) => (
								<div key={spec.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 ml-0 sm:ml-2">
									<span className="break-words">{spec.name}:</span>
									<span className="font-medium text-[#fbbf24] whitespace-nowrap">
										+GHS {spec.modifier.toFixed(2)}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			)}

			{/* Legacy Pricing Breakdown */}
			{isPageBased && pdfPageCount !== undefined && (
				<div className="space-y-1.5 text-xs sm:text-sm mb-2">
					<div className="flex justify-between text-gray-700">
						<span>PDF Pages:</span>
						<span className="font-medium">{pdfPageCount}</span>
					</div>
					{options.frontBack && (
						<div className="flex justify-between text-gray-700">
							<span>Sheets (2 pages/sheet):</span>
							<span className="font-medium">
								{Math.ceil(pdfPageCount / 2)}
							</span>
						</div>
					)}
					{agentService.pricePerUnit && (
						<>
							<div className="flex justify-between text-gray-700">
								<span>Unit Price per page:</span>
								<span className="font-medium">
									GHS {agentService.pricePerUnit.toFixed(2)}
								</span>
							</div>
							{options.color && agentService.colorPriceModifier && (
								<div className="flex justify-between text-gray-700">
									<span>Color modifier per page:</span>
									<span className="font-medium">
										GHS {agentService.colorPriceModifier.toFixed(2)}
									</span>
								</div>
							)}
							{options.color && agentService.colorPriceModifier && (
								<div className="flex justify-between text-gray-700 font-semibold">
									<span>Total Price per page:</span>
									<span className="font-medium">
										GHS {(agentService.pricePerUnit + agentService.colorPriceModifier).toFixed(2)}
									</span>
								</div>
							)}
						</>
					)}
					<div className="flex justify-between text-gray-700">
						<span>Quantity (copies):</span>
						<span className="font-medium">{quantity}</span>
					</div>
					{/* Calculation breakdown */}
					<div className="pt-2 mt-2 border-t border-green-100 text-xs text-gray-600">
						<div className="flex justify-between">
							<span>Calculation:</span>
							<span className="font-mono">
								{options.color && agentService.colorPriceModifier
									? `(${agentService.pricePerUnit} + ${agentService.colorPriceModifier}) × ${quantity} × ${options.frontBack ? Math.ceil(pdfPageCount / 2) : pdfPageCount}`
									: `${agentService.pricePerUnit} × ${quantity} × ${options.frontBack ? Math.ceil(pdfPageCount / 2) : pdfPageCount}`}
							</span>
						</div>
					</div>
				</div>
			)}
			<div className="pt-3 sm:pt-4 mt-3 sm:mt-4 border-t-2 border-[#fbbf24]/20 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
				<span className="text-xs sm:text-sm font-semibold text-gray-700 uppercase tracking-wide">Estimated Price</span>
				<div className="flex items-center gap-2 sm:gap-3">
					{calculatingPrice && (
						<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] animate-spin flex-shrink-0" />
					)}
					<div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#fbbf24]">
						GHS {priceInfo.calculatedPrice.toFixed(2)}
					</div>
				</div>
			</div>
		</div>
	);
};


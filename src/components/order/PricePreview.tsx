import { Calculator, Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
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
	// Area-based calculation props
	width?: number;
	height?: number;
	calculationBasis?: 'INCH' | 'FEET';
}

export const PricePreview = ({
	priceInfo,
	agentService,
	isPageBased,
	pdfPageCount,
	quantity,
	options,
calculatingPrice,
	width,
	height,
	calculationBasis,
}: PricePreviewProps) => {
	const usesFlexiblePricing = hasFlexiblePricing(agentService);
	const breakdown = priceInfo.breakdown;
	const [collapsed, setCollapsed] = useState(false);

	return (
		<div className={`bg-[#fbbf24]/5 border-2 border-[#fbbf24] rounded-lg p-4 sm:p-5 lg:p-6`}>
			<div className="flex items-center gap-2 mb-3 sm:mb-4">
				<Calculator className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] flex-shrink-0" />
				<h4 className="text-xs sm:text-sm font-bold text-gray-900 uppercase tracking-wide">
					Price Summary
				</h4>
				<button
					type="button"
					className="ml-auto text-xs font-semibold text-gray-700 hover:text-gray-900 transition-colors"
					onClick={() => setCollapsed((c) => !c)}
				>
					{collapsed ? (
						<><ChevronDown className="w-3 h-3 inline"/> Show</>
					) : (
						<><ChevronUp className="w-3 h-3 inline"/> Collapse</>
					)}
				</button>
			</div>

			{!collapsed ? (
				<>
					{/* Flexible Pricing Breakdown */}
					{usesFlexiblePricing && breakdown && (
						<>
							<div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
								{breakdown.baseConfiguration && (
									<div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700">
										<span className="break-words">Base ({breakdown.baseConfiguration.name}):</span>
										<span className="font-medium whitespace-nowrap">GHS {breakdown.baseConfiguration.price.toFixed(2)}</span>
								</div>
							)}
							{breakdown.options && breakdown.options.length > 0 && (
								<div className="space-y-1.5 sm:space-y-1">
									<div className="text-xs font-medium text-gray-600 uppercase">Options:</div>
									{breakdown.options.map((option) => (
										<div key={option.id} className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 ml-0 sm:ml-2">
											<span className="break-words">{option.name}:</span>
											<span className="font-medium text-[#fbbf24] whitespace-nowrap">+GHS {option.modifier.toFixed(2)}</span>
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
											<span className="font-medium text-[#fbbf24] whitespace-nowrap">+GHS {spec.modifier.toFixed(2)}</span>
										</div>
									))}
								</div>
							)}
						</div>
						{/* Show Dimensions, Quantity, and Calculation for AREA_BASED */}
						{!isPageBased && width && height && calculationBasis && (
							<div className="space-y-1.5 text-xs sm:text-sm mb-2">
								<div className="flex justify-between text-gray-700">
									<span>Width:</span>
									<span className="font-medium">{width} {calculationBasis === 'INCH' ? 'in' : 'ft'}</span>
								</div>
								<div className="flex justify-between text-gray-700">
									<span>Height:</span>
									<span className="font-medium">{height} {calculationBasis === 'INCH' ? 'in' : 'ft'}</span>
								</div>
								<div className="flex justify-between text-gray-700">
									<span>Area:</span>
									<span className="font-medium">
										{calculationBasis === 'INCH' 
											? `${(width * height).toFixed(0)} sq in (${(width * height / 144).toFixed(2)} sq ft)`
											: `${(width * height).toFixed(2)} sq ft`
										}
									</span>
								</div>
								<div className="flex justify-between text-gray-700">
									<span>Quantity (copies):</span>
									<span className="font-medium">{quantity}</span>
								</div>
								{/* Calculation breakdown */}
								<div className="pt-2 mt-2 border-t border-green-100 text-xs text-gray-600">
									<div className="flex justify-between">
										<span>Calculation:</span>
										<span className="font-mono">
											{(() => {
												const basePrice = breakdown.baseConfiguration?.price || 0;
												const perUnitModifiers = [
													...(breakdown.options || []).filter((opt) => opt.modifier > 0),
													...(breakdown.customSpecs || []).filter((spec) => spec.modifier > 0),
												];
												const sumOfModifiers = perUnitModifiers.reduce((sum, item) => sum + item.modifier, 0);
												const area = calculationBasis === 'INCH' ? width * height / 144 : width * height;
												
												
												if (sumOfModifiers > 0) {
													return `(${basePrice.toFixed(2)} + ${sumOfModifiers.toFixed(2)}) × ${area.toFixed(2)} × ${quantity}`;
												} else {
													return `${basePrice.toFixed(2)} × ${area.toFixed(2)} × ${quantity}`;
												}
											})()}
										</span>
									</div>
								</div>
							</div>
						)}
						{/* Show PDF Pages, Quantity, and Calculation for PAGE_BASED */}
						{isPageBased && pdfPageCount !== undefined && pdfPageCount > 0 && (
							<div className="space-y-1.5 text-xs sm:text-sm mb-2">
								<div className="flex justify-between text-gray-700">
									<span>PDF Pages:</span>
									<span className="font-medium">{pdfPageCount}</span>
								</div>
								{options.frontBack && (
									<div className="flex justify-between text-gray-700">
										<span>Sheets (2 pages/sheet):</span>
										<span className="font-medium">{Math.ceil(pdfPageCount / 2)}</span>
									</div>
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
											{(() => {
												const basePrice = breakdown.baseConfiguration?.price || 0;
												const perUnitModifiers = [
													...(breakdown.options || []).filter((opt) => opt.modifier > 0),
													...(breakdown.customSpecs || []).filter((spec) => spec.modifier > 0),
												];
												const sumOfModifiers = perUnitModifiers.reduce((sum, item) => sum + item.modifier, 0);
												const effectiveUnits = options.frontBack ? Math.ceil(pdfPageCount / 2) : pdfPageCount;
												if (sumOfModifiers > 0) {
													return `(${basePrice.toFixed(2)} + ${sumOfModifiers.toFixed(2)}) × ${quantity} × ${effectiveUnits}`;
												} else {
													return `${basePrice.toFixed(2)} × ${quantity} × ${effectiveUnits}`;
												}
											})()}
											</span>
									</div>
								</div>
							</div>
						)
					}
					</>
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
								<span className="font-medium">{Math.ceil(pdfPageCount / 2)}</span>
							</div>
						)}
						{agentService.pricePerUnit && (
							<div className="flex justify-between text-gray-700">
								<span>Unit Price per page:</span>
								<span className="font-medium">GHS {agentService.pricePerUnit.toFixed(2)}</span>
							</div>
						)}
					</div>
				)}
				{(!isPageBased || (isPageBased && pdfPageCount !== undefined && pdfPageCount > 0)) && (
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
				)}
			</>
			) : (
				<div className="py-2">
					<div className="flex items-center gap-2">
						<Loader2 className="w-4 h-4 animate-spin" />
						<span className="text-sm text-gray-600">Loading price…</span>
					</div>
				</div>
			)}
		</div>
	);
};

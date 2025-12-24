import { Calculator, Loader2 } from "lucide-react";
import type { AgentService, PriceCalculationResponse } from "../../services/orderApi";

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
}

export const PricePreview = ({
	priceInfo,
	agentService,
	isPageBased,
	pdfPageCount,
	quantity,
	options,
	calculatingPrice,
}: PricePreviewProps) => {
	return (
		<div className="bg-[#fbbf24]/5 border-2 border-[#fbbf24] rounded-lg p-4">
			<div className="flex items-center gap-2 mb-3">
				<Calculator className="w-5 h-5 text-[#fbbf24]" />
				<h4 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
					Price Calculation
				</h4>
			</div>
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
			<div className="pt-3 mt-3 border-t-2 border-[#fbbf24]/20 flex justify-between items-center">
				<span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Estimated Price</span>
				<div className="flex items-center gap-2">
					{calculatingPrice && (
						<Loader2 className="w-4 h-4 text-[#fbbf24] animate-spin" />
					)}
					<div className="text-2xl font-bold text-[#fbbf24]">
						GHS {priceInfo.calculatedPrice.toFixed(2)}
					</div>
				</div>
			</div>
		</div>
	);
};


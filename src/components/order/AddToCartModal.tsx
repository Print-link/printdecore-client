import { X } from "lucide-react";
import type { AgentService, PriceCalculationResponse } from "../../services/orderApi";

interface AddToCartModalProps {
	isOpen: boolean;
	onClose: () => void;
	onConfirm: () => void;
	onContinueShopping: () => void;
	itemDetails: {
		serviceName?: string;
		width?: number;
		height?: number;
		measurementUnit: "FEET" | "INCH" | "UNIT";
		quantity: number;
		options: {
			frontBack?: boolean;
			color?: boolean;
			printCut?: boolean;
			frontOnly?: boolean;
			filePages?: number;
		};
		filesCount: number;
		calculatedPrice: number;
		priceInfo?: PriceCalculationResponse;
		agentService?: AgentService;
		isPageBased?: boolean;
	};
}

export const AddToCartModal = ({
	isOpen,
	onClose,
	onConfirm,
	onContinueShopping,
	itemDetails,
}: AddToCartModalProps) => {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="absolute inset-0 bg-black bg-opacity-30 transition-opacity"
				onClick={onClose}
			/>

			{/* Modal */}
			<div className="relative bg-white rounded-lg border-2 border-gray-200 max-w-sm w-full overflow-hidden">
				{/* Header */}
				<div className="px-4 py-3 border-b-2 border-gray-200 flex items-center justify-between">
					<h2 className="text-base font-bold text-gray-900">Add to Cart</h2>
					<button
						onClick={onClose}
						className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Close"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<div className="p-4 space-y-3">
					{/* Item Summary */}
					<div className="space-y-2">

						{/* Dimensions */}
						{itemDetails.width && itemDetails.height && (
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">Dimensions</span>
								<span className="font-semibold text-gray-900">
									{itemDetails.width} × {itemDetails.height} {itemDetails.measurementUnit}
								</span>
							</div>
						)}

						{/* Quantity */}
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Quantity</span>
							<span className="font-semibold text-gray-900">{itemDetails.quantity}</span>
						</div>

						{/* PDF Pages (for PAGE_BASED) */}
						{itemDetails.isPageBased && itemDetails.options.filePages && (
							<div className="flex justify-between text-sm">
								<span className="text-gray-600">PDF Pages</span>
								<span className="font-semibold text-gray-900">
									{itemDetails.options.filePages}
								</span>
							</div>
						)}

						{/* Files */}
						<div className="flex justify-between text-sm">
							<span className="text-gray-600">Files</span>
							<span className="font-semibold text-gray-900">
								{itemDetails.filesCount} file{itemDetails.filesCount !== 1 ? "s" : ""}
							</span>
						</div>

						{/* Options */}
						{(itemDetails.options.frontBack ||
							itemDetails.options.color ||
							itemDetails.options.printCut) && (
							<div className="pt-2 border-t border-gray-200">
								<div className="flex flex-wrap gap-2">
									{itemDetails.options.frontBack && (
										<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
											Front & Back
										</span>
									)}
									{itemDetails.options.color && (
										<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
											Color
										</span>
									)}
									{itemDetails.options.printCut && (
										<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
											Print & Cut
										</span>
									)}
								</div>
							</div>
						)}
					</div>

					{/* Price */}
					<div className="pt-2 border-t-2 border-gray-200">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-gray-700">Total</span>
							<span className="text-xl font-bold text-[#fbbf24]">
								GHS {itemDetails.calculatedPrice.toFixed(2)}
							</span>
						</div>
					</div>
				</div>

				{/* Footer Actions */}
				<div className="px-4 py-3 border-t-2 border-gray-200 flex gap-2">
					<button
						onClick={onClose}
						className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={onContinueShopping}
						className="flex-1 px-4 py-2.5 border-2 border-[#fbbf24] text-[#fbbf24] rounded-lg font-semibold hover:bg-[#fbbf24]/5 transition-colors"
					>
						Continue
					</button>
					<button
						onClick={onConfirm}
						className="flex-1 px-4 py-2.5 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] transition-colors"
					>
						View Cart
					</button>
				</div>
			</div>
		</div>
	);
};


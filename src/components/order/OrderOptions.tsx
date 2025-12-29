import type { AgentService } from "../../services/orderApi";
import { hasFlexiblePricing, formatPriceModifier } from "../../utils/pricingUtils";

interface OrderOptionsProps {
	agentService: AgentService;
	// Legacy format
	options?: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
	};
	onOptionChange?: (option: "frontBack" | "color" | "printCut" | "frontOnly", value: boolean) => void;
	// New flexible format
	selectedOptions?: string[];
	onSelectedOptionsChange?: (options: string[]) => void;
	isPageBased: boolean;
}

export const OrderOptions = ({
	agentService,
	options,
	onOptionChange,
	selectedOptions = [],
	onSelectedOptionsChange,
	isPageBased,
}: OrderOptionsProps) => {
	const usesFlexiblePricing = hasFlexiblePricing(agentService);
	const pricingOptions = agentService.pricingConfig?.options || [];

	// Handle new flexible pricing format
	if (usesFlexiblePricing && onSelectedOptionsChange) {
		const handleOptionToggle = (optionId: string) => {
			if (selectedOptions.includes(optionId)) {
				onSelectedOptionsChange(selectedOptions.filter(id => id !== optionId));
			} else {
				onSelectedOptionsChange([...selectedOptions, optionId]);
			}
		};

		const enabledOptions = pricingOptions.filter(opt => opt.enabled !== false);

		if (enabledOptions.length === 0) {
			return null;
		}

		return (
			<div>
				<label className="block text-sm sm:text-base font-medium text-gray-700 mb-3 sm:mb-4">
					Options
				</label>
				<div className="space-y-2 sm:space-y-3">
					{enabledOptions.map((option) => {
						const isSelected = selectedOptions.includes(option.id);
						const isDefault = option.default === true;
						const hasModifier = option.priceModifier > 0;

						return (
							<label
								key={option.id}
								className={`flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
									isSelected || isDefault
										? "border-[#fbbf24] bg-[#fef3c7]"
										: "border-gray-200 hover:border-gray-300"
								} ${isDefault ? "opacity-90" : ""}`}
							>
								<div className="flex items-start sm:items-center flex-1">
									<input
										type="checkbox"
										checked={isSelected || isDefault}
										onChange={() => {
											// Don't allow unchecking default options
											if (!isDefault) {
												handleOptionToggle(option.id);
											}
										}}
										disabled={isDefault}
										className="mt-1 sm:mt-0 mr-3 w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] focus:ring-[#fbbf24] rounded disabled:opacity-50 flex-shrink-0"
									/>
									<div className="flex-1 min-w-0">
										<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
											<span className="text-sm sm:text-base font-medium text-gray-900 break-words">
												{option.name}
											</span>
											<div className="flex items-center gap-2 flex-wrap">
												{isDefault && (
													<span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded whitespace-nowrap">
														Default
													</span>
												)}
												{hasModifier && (
													<span className="text-xs sm:text-sm font-medium text-[#fbbf24] whitespace-nowrap">
														{formatPriceModifier(
															option.priceModifier,
															option.modifierType
														)}
													</span>
												)}
											</div>
										</div>
										{option.description && (
											<p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-1.5">
												{option.description}
											</p>
										)}
									</div>
								</div>
							</label>
						);
					})}
				</div>
			</div>
		);
	}

	// Legacy format (backward compatibility)
	if (!onOptionChange) {
		return null;
	}

	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-3">
				Options
			</label>
			<div className="space-y-2">
				{agentService.supportsFrontBack && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options?.frontBack || false}
							onChange={(e) => {
								onOptionChange("frontBack", e.target.checked);
								onOptionChange("frontOnly", !e.target.checked);
							}}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">
							{isPageBased
								? "Front & Back Printing"
								: "Front & Back Printing (+20%)"}
						</span>
					</label>
				)}
				{agentService.supportsFrontOnly && !options?.frontBack && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options?.frontOnly || false}
							onChange={(e) => {
								onOptionChange("frontOnly", e.target.checked);
								onOptionChange("frontBack", !e.target.checked);
							}}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">Front Only</span>
					</label>
				)}
				{agentService.supportsColor && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options?.color || false}
							onChange={(e) => onOptionChange("color", e.target.checked)}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">
							{isPageBased && agentService.colorPriceModifier
								? `Color Printing (+GHS ${agentService.colorPriceModifier.toFixed(2)} per page)`
								: "Color Printing"}
						</span>
					</label>
				)}
				{agentService.supportsPrintCut && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options?.printCut || false}
							onChange={(e) => onOptionChange("printCut", e.target.checked)}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">Print & Cut (+15%)</span>
					</label>
				)}
			</div>
		</div>
	);
};


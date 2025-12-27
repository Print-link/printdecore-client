import { toast } from "react-toastify";
import type { PricingConfig } from "../../services/orderApi";

interface BaseConfigurationSelectorProps {
	pricingConfig: PricingConfig | null;
	selectedBaseConfigId: string | null;
	onSelect: (configId: string) => void;
	measurementUnit?: "FEET" | "INCH" | "UNIT";
	showDimensions?: boolean;
	width?: number;
	height?: number;
	onWidthChange?: (width: number) => void;
	onHeightChange?: (height: number) => void;
	onMeasurementUnitChange?: (unit: "FEET" | "INCH" | "UNIT") => void;
}

export const BaseConfigurationSelector = ({
	pricingConfig,
	selectedBaseConfigId,
	onSelect,
	measurementUnit = "FEET",
	showDimensions = false,
	width,
	height,
	onWidthChange,
	onHeightChange,
	onMeasurementUnitChange,
}: BaseConfigurationSelectorProps) => {
	if (
		!pricingConfig ||
		!pricingConfig.baseConfigurations ||
		!Array.isArray(pricingConfig.baseConfigurations) ||
		pricingConfig.baseConfigurations.length === 0
	) {
		return null;
	}

	const POPULAR_BASE_CONFIG_IDS = ["a4"];

	console.log("Pricing Config", pricingConfig);

	return (
		<div className="space-y-4">
			<label className="block text-sm font-medium text-gray-700 mb-3">
				Base Configuration *
			</label>

			<div className="space-y-2">
				{pricingConfig.baseConfigurations.map((config) => {
					const isSelected = selectedBaseConfigId === config.id;
					const isCustom = config.isCustom === true;
					const isPopular = POPULAR_BASE_CONFIG_IDS.includes(config.id);
					return (
						<div key={config.id}>
							<label
								className={`relative flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
									isSelected
										? "border-[#fbbf24] bg-[#fef3c7]"
										: "border-gray-200 hover:border-gray-300"
								}`}
							>
								<input
									type="radio"
									name="baseConfig"
									value={config.id}
									checked={isSelected}
									onChange={() => config.unitPrice > 0 ? onSelect(config.id) : toast.error("Please select a valid base configuration")}
									className="mr-3 w-4 h-4 text-[#fbbf24] focus:ring-[#fbbf24]"
								/>
								<div className="flex-1">
									<div className="flex items-center justify-between">
										<span className="font-semibold text-gray-900">
											{config.name}
										</span>
										<div>
											{isPopular && (
												<span className="text-xs text-emerald-400 mr-3">
													Popular
												</span>
											)}
										<span className="text-sm font-medium text-[#fbbf24]">
											GHS {config?.unitPrice?.toFixed(2)}
											{config.width && config.height
												? ` per ${config.width}×${config.height}`
												: " per unit"}
										</span>
										</div>
									</div>
									{config.description && (
										<p className="text-xs text-gray-600 mt-1">
											{config.description}
										</p>
									)}
								</div>
							</label>

							{/* Show custom size input when custom is selected */}
							{isCustom && isSelected && showDimensions && (
								<div className="ml-0 sm:ml-7 mt-3 sm:mt-2 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3 sm:space-y-2">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-2">
										<div>
											<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
												Width
											</label>
											<input
												type="number"
												value={width || ""}
												onChange={(e) =>
													onWidthChange?.(Number(e.target.value))
												}
												placeholder="0"
												min="0"
												step="0.01"
												className="w-full px-3 sm:px-2 py-2 sm:py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
											/>
										</div>
										<div>
											<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
												Height
											</label>
											<input
												type="number"
												value={height || ""}
												onChange={(e) =>
													onHeightChange?.(Number(e.target.value))
												}
												placeholder="0"
												min="0"
												step="0.01"
												className="w-full px-3 sm:px-2 py-2 sm:py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
											/>
										</div>
									</div>
									{onMeasurementUnitChange && (
										<div>
											<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-1">
												Unit
											</label>
											<select
												value={measurementUnit}
												onChange={(e) =>
													onMeasurementUnitChange(
														e.target.value as "FEET" | "INCH" | "UNIT"
													)
												}
												className="w-full px-3 sm:px-2 py-2 sm:py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
											>
												<option value="FEET">Feet</option>
												<option value="INCH">Inches</option>
												<option value="UNIT">Units</option>
											</select>
										</div>
									)}
								</div>
							)}
						</div>
					);
				})}
			</div>
		</div>
	);
};

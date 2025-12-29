import { useState, useEffect, useMemo } from "react";
import type {
	PriceCalculationResponse,
	AgentService,
	PriceCalculationRequest,
} from "../services/orderApi";
import type { MeasurementUnit } from "../services/orderApi";
import { hasFlexiblePricing } from "../utils/pricingUtils";
import { calculateOrderPriceFrontend } from "../utils/frontendPriceCalculation";

interface OrderFormData {
	// New flexible pricing format
	selectedBaseConfigId?: string;
	selectedOptions?: string[];
	selectedCustomSpecs?: string[];

	// Legacy format (for backward compatibility)
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
		filePages?: number;
		numberOfPages?: number;
	};
}

interface UseOrderPriceCalculationProps {
	agentServiceId: string | null;
	formData: OrderFormData;
	agentService: AgentService | null;
	pdfPageCount?: number;
}

export const useOrderPriceCalculation = ({
	// agentServiceId, <-- unused
	formData,
	agentService,
	pdfPageCount,
}: UseOrderPriceCalculationProps) => {
	const [calculatingPrice, setCalculatingPrice] = useState<boolean>(false);
	const [priceInfo, setPriceInfo] = useState<PriceCalculationResponse | null>(
		null
	);
	const [formulaType, setFormulaType] = useState<string | null>(null);

	// Check if service uses flexible pricing
	const usesFlexiblePricing = hasFlexiblePricing(agentService);

	// Memoize form data to prevent unnecessary recalculations
	const memoizedFormData = useMemo(
		() => formData,
		[
			// New flexible pricing fields
			formData.selectedBaseConfigId,
			formData.selectedOptions?.join(","), // Convert array to string for comparison
			formData.selectedCustomSpecs?.join(","), // Convert array to string for comparison
			// Legacy fields
			formData.width,
			formData.height,
			formData.measurementUnit,
			formData.quantity,
			formData.options.frontBack,
			formData.options.color,
			formData.options.printCut,
			formData.options.frontOnly,
			formData.options.filePages,
			formData.options.numberOfPages,
		]
	);

	// Removed calculatePriceAsync as we use frontend calculation now

	// Get formula type directly from agentService if available
	useEffect(() => {
		if (agentService?.formulaType && !formulaType) {
			setFormulaType(agentService.formulaType);
		}
	}, [agentService, formulaType]);

	// Calculate price when form data changes (instant)
	useEffect(() => {
		if (agentService) {
			const calculate = async () => {
				setCalculatingPrice(true);
				try {
					// Prepare request similar to before but for local function
					const requestPayload: PriceCalculationRequest = {
						quantity: memoizedFormData.quantity,
					};

					if (usesFlexiblePricing) {
						if (memoizedFormData.selectedBaseConfigId) {
							requestPayload.selectedBaseConfigId = memoizedFormData.selectedBaseConfigId;
						}
						if (memoizedFormData.selectedOptions?.length) {
							requestPayload.selectedOptions = memoizedFormData.selectedOptions;
						}
						if (memoizedFormData.selectedCustomSpecs?.length) {
							requestPayload.selectedCustomSpecs = memoizedFormData.selectedCustomSpecs;
						}
						if (pdfPageCount && pdfPageCount > 0) {
							requestPayload.filePages = pdfPageCount;
						}
						// Also pass legacy options for compatibility (e.g., frontBack for PAGE_BASED)
						if (memoizedFormData.options) {
							requestPayload.options = {
								...memoizedFormData.options,
								filePages: pdfPageCount,
								numberOfPages: pdfPageCount,
							};
						}
					} else {
						const options = { ...memoizedFormData.options };
						if (pdfPageCount && pdfPageCount > 0) {
							options.filePages = pdfPageCount;
							options.numberOfPages = pdfPageCount;
						}
						requestPayload.width = memoizedFormData.width;
						requestPayload.height = memoizedFormData.height;
						requestPayload.measurementUnit = memoizedFormData.measurementUnit;
						requestPayload.options = Object.keys(options).length > 0 ? options : undefined;
					}

					console.log('request payload ---', requestPayload)
					console.log('agent service ---', agentService)

					// Use frontend calculation
					const result = calculateOrderPriceFrontend(agentService, requestPayload);

					console.log('result ---', result)
					
					setPriceInfo(result);
					if (!formulaType && result.formulaType) {
						setFormulaType(result.formulaType);
					}
				} catch (err) {
					console.error("Error calculating price:", err);
				} finally {
					setCalculatingPrice(false);
				}
			};

			calculate();
		}
	}, [
		memoizedFormData,
		agentService,
		pdfPageCount,
		usesFlexiblePricing,
		formulaType // kept for consistency if needed, though local calc is fast
	]);

	return {
		priceInfo,
		calculatingPrice,
		formulaType: formulaType || priceInfo?.formulaType,
		usesFlexiblePricing,
	};
};


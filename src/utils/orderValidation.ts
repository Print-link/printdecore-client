import { toast } from "react-toastify";
import type { PriceCalculationResponse, AgentService } from "../services/orderApi";
import { hasFlexiblePricing, isCustomBaseConfig } from "./pricingUtils";

interface ValidationParams {
	priceInfo: PriceCalculationResponse | null;
	selectedFiles: File[];
	pdfPageCount?: number;
	width?: number;
	height?: number;
	// New flexible pricing fields
	agentService?: AgentService | null;
	selectedBaseConfigId?: string;
}

export const validateOrderForm = ({
	priceInfo,
	selectedFiles,
	pdfPageCount,
	width,
	height,
	agentService,
	selectedBaseConfigId,
}: ValidationParams): boolean => {
	const isPageBased = priceInfo?.formulaType === "PAGE_BASED";
	const usesFlexiblePricing = agentService ? hasFlexiblePricing(agentService) : false;

	// Validate flexible pricing fields
	if (usesFlexiblePricing) {
		if (!selectedBaseConfigId) {
			toast.error("Please select a base configuration");
			return false;
		}

		// If custom size is selected, validate dimensions
		if (agentService?.pricingConfig) {
			const isCustom = isCustomBaseConfig(selectedBaseConfigId, agentService.pricingConfig);
			if (isCustom && (!width || !height)) {
				toast.error("Please enter width and height for custom size");
				return false;
			}
		}
	}

	if (isPageBased) {
		// For PAGE_BASED (Bond Paper), require PDF file with page count
		if (selectedFiles.length === 0) {
			toast.error("Please upload a PDF file");
			return false;
		}
		if (!pdfPageCount || pdfPageCount < 1) {
			toast.error(
				"Please wait for PDF pages to be counted, or upload a valid PDF file"
			);
			return false;
		}
	} else {
		// For other formulas, validate dimensions if not using flexible pricing
		if (!usesFlexiblePricing && (!width || !height)) {
			toast.error("Width and height are required");
			return false;
		}
		if (selectedFiles.length === 0) {
			toast.error("Please upload at least one file");
			return false;
		}
	}

	return true;
};


import { toast } from "react-toastify";
import type { PriceCalculationResponse } from "../services/orderApi";

interface ValidationParams {
	priceInfo: PriceCalculationResponse | null;
	selectedFiles: File[];
	pdfPageCount?: number;
	width?: number;
	height?: number;
}

export const validateOrderForm = ({
	priceInfo,
	selectedFiles,
	pdfPageCount,
	width,
	height,
}: ValidationParams): boolean => {
	const isPageBased = priceInfo?.formulaType === "PAGE_BASED";

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
		// For other formulas, validate dimensions if needed
		if (!width || !height) {
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


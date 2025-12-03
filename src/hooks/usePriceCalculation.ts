import { useMemo } from "react";
import { calculateRegularFormatPrice } from "../utils/pdfUtils";
import type { Category } from "../types/category";

interface UsePriceCalculationProps {
	selectedCategory: Category | null;
	isResultsChecker: boolean;
	isLargeFormat: boolean;
	isRegularFormat: boolean;
	numberOfCopies: string;
	pdfPageCount?: number;
	quantity: string;
}

export const usePriceCalculation = ({
	selectedCategory,
	isResultsChecker,
	isLargeFormat,
	isRegularFormat,
	numberOfCopies,
	pdfPageCount,
	quantity,
}: UsePriceCalculationProps) => {
	const totalPrice = useMemo(() => {
		if (!selectedCategory) return undefined;

		if (isResultsChecker) {
			return selectedCategory.unitPrice;
		}

		if (isLargeFormat) {
			const copies = parseInt(numberOfCopies, 10);
			if (isNaN(copies) || copies < 1) return undefined;
			return selectedCategory.unitPrice * copies;
		}

		if (isRegularFormat) {
			if (
				!selectedCategory.regularFormatProperties ||
				!pdfPageCount ||
				!numberOfCopies
			) {
				return undefined;
			}

			const copies = parseInt(numberOfCopies, 10);
			if (isNaN(copies) || copies < 1) {
				return undefined;
			}

			return calculateRegularFormatPrice(
				pdfPageCount,
				selectedCategory.regularFormatProperties,
				selectedCategory.unitPrice,
				copies
			);
		}

		const qty = parseInt(quantity, 10);
		if (isNaN(qty) || qty < 1) return undefined;
		return selectedCategory.unitPrice * qty;
	}, [
		selectedCategory,
		isResultsChecker,
		isLargeFormat,
		isRegularFormat,
		numberOfCopies,
		pdfPageCount,
		quantity,
	]);

	return { totalPrice };
};


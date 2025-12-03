import { useMemo } from "react";
import type { Category } from "../types/category";

interface ResultsCheckerForm {
	indexNumber: string;
	yearOfCompletion: string;
	dateOfBirth?: string;
}

interface OrderDetails {
	artwork: string;
	width: string;
	height: string;
	quantity: string;
	location: string;
	description: string;
}

interface UseFormValidationProps {
	selectedCategory: Category | null;
	isResultsChecker: boolean;
	isNovDecResult: boolean;
	isBeceOrWassceResult: boolean;
	isLargeFormat: boolean;
	isRegularFormat: boolean;
	isFormatCategory: boolean;
	selectedFile: File | null;
	resultsCheckerForm: ResultsCheckerForm;
	orderDetails: OrderDetails;
	numberOfCopies: string;
}

export const useFormValidation = ({
	selectedCategory,
	isResultsChecker,
	isNovDecResult,
	isBeceOrWassceResult,
	isLargeFormat,
	isRegularFormat,
	isFormatCategory,
	selectedFile,
	resultsCheckerForm,
	orderDetails,
	numberOfCopies,
}: UseFormValidationProps) => {
	const isFormValid = useMemo(() => {
		if (!selectedCategory) {
			return false;
		}

		if (isResultsChecker) {
			if (isNovDecResult) {
				return (
					resultsCheckerForm.indexNumber &&
					resultsCheckerForm.yearOfCompletion &&
					resultsCheckerForm.dateOfBirth
				);
			} else if (isBeceOrWassceResult) {
				return (
					resultsCheckerForm.indexNumber && resultsCheckerForm.yearOfCompletion
				);
			}
			return false;
		} else if (isFormatCategory) {
			if (isLargeFormat) {
				return (
					selectedFile &&
					orderDetails.width &&
					orderDetails.height &&
					numberOfCopies
				);
			} else if (isRegularFormat) {
				return selectedFile && numberOfCopies;
			}
			return false;
		} else {
			return (
				selectedFile &&
				orderDetails.artwork &&
				orderDetails.width &&
				orderDetails.height &&
				orderDetails.quantity &&
				orderDetails.location
			);
		}
	}, [
		selectedCategory,
		isResultsChecker,
		isNovDecResult,
		isBeceOrWassceResult,
		isLargeFormat,
		isRegularFormat,
		isFormatCategory,
		selectedFile,
		resultsCheckerForm,
		orderDetails,
		numberOfCopies,
	]);

	return { isFormValid };
};


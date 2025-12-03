import { useState, useCallback } from "react";
import { toast } from "react-toastify";
import type { Category } from "../types/category";
import {
	submitResultsChecker,
	submitFormatPrintJob,
	submitRegularPrintJob,
} from "../services/printJobApi";

interface PendingSubmission {
	type: "results" | "format" | "regular";
	data?: unknown;
}

interface UsePrintJobSubmissionProps {
	selectedCategory: Category | null;
	adminId: string;
	userId: string;
}

export const usePrintJobSubmission = ({
	selectedCategory,
	adminId,
	userId,
}: UsePrintJobSubmissionProps) => {
	const [uploading, setUploading] = useState(false);
	const [pendingSubmission, setPendingSubmission] =
		useState<PendingSubmission | null>(null);

	const handlePaymentSuccess = useCallback(
		async (reference: string) => {
			if (!pendingSubmission || !selectedCategory) {
				return;
			}

			setUploading(true);

			try {
				let response;

				if (pendingSubmission.type === "results") {
					const data = pendingSubmission.data as {
						indexNumber: string;
						yearOfCompletion: string;
						dateOfBirth?: string;
					};
				response = await submitResultsChecker({
					categoryId: selectedCategory._id || selectedCategory.id,
					adminId,
					indexNumber: data.indexNumber.trim(),
					yearOfCompletion: data.yearOfCompletion.trim(),
					dateOfBirth: data.dateOfBirth?.trim(),
					categoryType: selectedCategory.categoryType || "",
					clientId: userId,
					paymentReference: reference,
				});
				} else if (pendingSubmission.type === "format") {
					const formData = pendingSubmission.data as FormData;
					formData.append("paymentReference", reference);
					response = await submitFormatPrintJob(formData, userId);
				} else if (pendingSubmission.type === "regular") {
					const formData = pendingSubmission.data as FormData;
					formData.append("paymentReference", reference);
					response = await submitRegularPrintJob(formData, userId);
				} else {
					throw new Error("Invalid submission type");
				}

				toast.success(response.message || "Order submitted successfully!");
				return { success: true, message: response.message };
			} catch (error: unknown) {
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to submit order. Please try again.";
				toast.error(errorMessage);
				return { success: false, message: errorMessage };
			} finally {
				setUploading(false);
			}
		},
		[pendingSubmission, selectedCategory, adminId, userId]
	);

	const handlePaymentError = useCallback((error: string) => {
		toast.error(error);
		setPendingSubmission(null);
	}, []);

	const resetForm = useCallback(() => {
		setPendingSubmission(null);
	}, []);

	return {
		uploading,
		pendingSubmission,
		setPendingSubmission,
		handlePaymentSuccess,
		handlePaymentError,
		resetForm,
	};
};


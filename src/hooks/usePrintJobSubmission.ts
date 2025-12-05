import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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
	const navigate = useNavigate();
	const [uploading, setUploading] = useState(false);
	const [pendingSubmission, setPendingSubmission] =
		useState<PendingSubmission | null>(null);

	const handlePaymentSuccess = useCallback(
		async (paymentData: { reference: string; amount: number }) => {
			if (!pendingSubmission || !selectedCategory) {
				return;
			}

			setUploading(true);

			try {
				// Calculate subaccount share (93% of total payment amount)
				const subaccountShare = paymentData.amount * 0.93;
				const totalPrice = Math.round(subaccountShare * 100) / 100; // Round to 2 decimal places

				// Prepare payment fields
				const paymentFields = {
					paymentReference: paymentData.reference,
					paymentStatus: "paid",
					totalPrice: totalPrice,
					paidAt: new Date().toISOString(),
				};

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
						...paymentFields,
					});
				} else if (pendingSubmission.type === "format") {
					const formData = pendingSubmission.data as FormData;
					formData.append("paymentReference", paymentFields.paymentReference);
					formData.append("paymentStatus", paymentFields.paymentStatus);
					formData.append("totalPrice", paymentFields.totalPrice.toString());
					formData.append("paidAt", paymentFields.paidAt);
					response = await submitFormatPrintJob(formData, userId);
				} else if (pendingSubmission.type === "regular") {
					const formData = pendingSubmission.data as FormData;
					formData.append("paymentReference", paymentFields.paymentReference);
					formData.append("paymentStatus", paymentFields.paymentStatus);
					formData.append("totalPrice", paymentFields.totalPrice.toString());
					formData.append("paidAt", paymentFields.paidAt);
					response = await submitRegularPrintJob(formData, userId);
				} else {
					throw new Error("Invalid submission type");
				}

				toast.success(/*response.message || */ "Order submitted successfully!");
				setTimeout(() => {
					navigate("/history");
				}, 1000);

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
		[pendingSubmission, selectedCategory, adminId, userId, navigate]
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


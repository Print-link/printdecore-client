import { useState, useEffect, useCallback } from "react";
import { X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import {
	initializePayment,
	verifyPayment,
	createSplit,
	type CreateSplitData,
} from "../services/paystackService";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	amount: number; // Amount in GHS
	email: string;
	subaccount: string; // paystackSubaccountCode
	onPaymentSuccess: (reference: string) => void;
	onPaymentError: (error: string) => void;
}

export const PaymentModal = ({
	isOpen,
	onClose,
	amount,
	email,
	subaccount,
	onPaymentSuccess,
	onPaymentError,
}: PaymentModalProps) => {
	const [loading, setLoading] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const verifyPaymentStatus = useCallback(async (reference: string) => {
		setVerifying(true);
		setError(null);

		try {
			const response = await verifyPayment(reference);

			if (response.status && response.data?.status === "success") {
				onPaymentSuccess(reference);
				setTimeout(() => {
					onClose();
				}, 2000);
			} else {
				throw new Error(
					response.message || "Payment verification failed"
				);
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to verify payment. Please contact support.";
			setError(errorMessage);
			onPaymentError(errorMessage);
		} finally {
			setVerifying(false);
		}
	}, [onPaymentSuccess, onClose, onPaymentError]);

	const handleInitializePayment = useCallback(async () => {
		if (!isOpen || !subaccount) {
			setError("Payment information is missing");
			return;
		}

		setLoading(true);
		setError(null);

		try {
			/* Convert GHS to pesewas (multiply by 100) this is beign handled at the backend*/
			const amountInPesewas = amount;

			// Create split payment configuration
			// The split will give 100% to the print station subaccount
			// You can adjust the share percentage as needed
			const splitData: CreateSplitData = {
				name: `Print Job Payment - ${new Date().toISOString()}`,
				type: "percentage",
				currency: "GHS", // Use GHS for Ghana
				subaccounts: [
					{
						subaccount: subaccount,
						share: 100,
					},
				],
			};

			let splitCode: string | undefined;
			try {
				const splitResponse = await createSplit(splitData);
				if (splitResponse.status && splitResponse.data?.split_code) {
					splitCode = splitResponse.data.split_code;
				}
			} catch (splitError) {
				console.warn("Failed to create split, using direct subaccount:", splitError);
				// If split creation fails, fall back to direct subaccount
			}

			// Initialize payment with split or subaccount
			const response = await initializePayment({
				amount: amountInPesewas,
				email,
				currency: "GHS", // Use GHS for Ghana
				...(splitCode ? { split_code: splitCode } : { subaccount }),
				metadata: {
					custom_fields: [
						{
							display_name: "Payment For",
							variable_name: "payment_for",
							value: "Print Job",
						},
					],
				},
			});

			if (response.status && response.data?.authorization_url) {
				// Open Paystack payment page in a new window
				const paymentWindow = window.open(
					response.data.authorization_url,
					"PaystackPayment",
					"width=600,height=700,scrollbars=yes"
				);

				// Listen for payment completion
				const checkPayment = setInterval(async () => {
					if (paymentWindow?.closed) {
						clearInterval(checkPayment);
						// Verify payment when window is closed
						if (response.data?.reference) {
							await verifyPaymentStatus(response.data.reference);
						}
					}
				}, 1000);

				// Also listen for postMessage from Paystack (if implemented)
				const handleMessage = (event: MessageEvent) => {
					if (event.data?.type === "PAYSTACK_SUCCESS" && event.data?.reference) {
						verifyPaymentStatus(event.data.reference);
						window.removeEventListener("message", handleMessage);
					}
				};
				window.addEventListener("message", handleMessage);

				// Cleanup after 30 minutes
				setTimeout(() => {
					clearInterval(checkPayment);
					window.removeEventListener("message", handleMessage);
				}, 30 * 60 * 1000);
			} else {
				throw new Error(response.message || "Failed to initialize payment");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to initialize payment";
			setError(errorMessage);
			onPaymentError(errorMessage);
		} finally {
			setLoading(false);
		}
	}, [isOpen, subaccount, amount, email, onPaymentError, verifyPaymentStatus]);

	useEffect(() => {
		if (isOpen) {
			setError(null);
			handleInitializePayment();
		}
	}, [isOpen, handleInitializePayment]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					disabled={loading || verifying}
				>
					<X className="w-5 h-5" />
				</button>

				<div className="text-center">
					{loading && (
						<>
							<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Initializing Payment
							</h3>
							<p className="text-sm text-gray-600">
								Redirecting to Paystack...
							</p>
						</>
					)}

					{verifying && (
						<>
							<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Verifying Payment
							</h3>
							<p className="text-sm text-gray-600">
								Please wait while we verify your payment...
							</p>
						</>
					)}

					{error && !loading && !verifying && (
						<>
							<AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Payment Error
							</h3>
							<p className="text-sm text-red-600 mb-4">{error}</p>
							<button
								onClick={handleInitializePayment}
								className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
							>
								Try Again
							</button>
						</>
					)}

					{!loading && !verifying && !error && (
						<>
							<CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Payment Successful
							</h3>
							<p className="text-sm text-gray-600">
								Your payment has been verified. Processing your order...
							</p>
						</>
					)}

					<div className="mt-6 pt-4 border-t border-gray-200">
						<div className="flex justify-between items-center text-sm">
							<span className="text-gray-600">Amount:</span>
							<span className="font-semibold text-gray-900">
								GHS {amount.toFixed(2)}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, CheckCircle, AlertCircle, CreditCard } from "lucide-react";
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

type PaymentState =
	| "idle"
	| "initializing"
	| "waiting"
	| "verifying"
	| "success"
	| "error";

export const PaymentModal = ({
	isOpen,
	onClose,
	amount,
	email,
	subaccount,
	onPaymentSuccess,
	onPaymentError,
}: PaymentModalProps) => {
	const [state, setState] = useState<PaymentState>("idle");
	const [error, setError] = useState<string | null>(null);
	const [paymentReference, setPaymentReference] = useState<string | null>(null);

	// Refs to prevent duplicate operations
	const verificationInProgressRef = useRef(false);
	const paymentWindowRef = useRef<Window | null>(null);
	const pollingIntervalRef = useRef<number | null>(null);
	const cleanupTimeoutRef = useRef<number | null>(null);

	// Cleanup function
	const cleanup = useCallback(() => {
		if (pollingIntervalRef.current) {
			clearInterval(pollingIntervalRef.current);
			pollingIntervalRef.current = null;
		}
		if (cleanupTimeoutRef.current) {
			clearTimeout(cleanupTimeoutRef.current);
			cleanupTimeoutRef.current = null;
		}
		if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
			paymentWindowRef.current.close();
		}
		paymentWindowRef.current = null;
	}, []);

	// Poll payment status with exponential backoff
	const pollPaymentStatus = useCallback(
		async (
			reference: string,
			attempt: number = 1,
			maxAttempts: number = 10
		) => {
			if (verificationInProgressRef.current) {
				return;
			}

			verificationInProgressRef.current = true;
			setState("verifying");

			try {
				const response = await verifyPayment(reference);

				if (!response.status) {
					throw new Error(response.message || "Payment verification failed");
				}

				const transactionStatus = response.data?.status;

				console.log("transactionStatus ----", transactionStatus);

				if (transactionStatus === "success") {
					// Payment successful
					verificationInProgressRef.current = false;
					setState("success");
					cleanup();
					onPaymentSuccess(reference);
					// Auto-close after showing success
					setTimeout(() => {
						onClose();
					}, 1500);
				} else if (
					transactionStatus === "failed" ||
					transactionStatus === "abandoned"
				) {
					// Payment failed or cancelled
					verificationInProgressRef.current = false;
					setState("error");
					const errorMessage =
						transactionStatus === "abandoned"
							? "Payment was cancelled. Please try again if you want to complete the payment."
							: "Payment failed. Please try again.";
					setError(errorMessage);
					cleanup();
					onPaymentError(errorMessage);
				} else if (attempt < maxAttempts) {
					// Payment still pending - poll again with exponential backoff
					verificationInProgressRef.current = false;
					setState("waiting");

					// Exponential backoff: 2s, 3s, 5s, 8s, etc.
					const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 10000);

					setTimeout(() => {
						pollPaymentStatus(reference, attempt + 1, maxAttempts);
					}, delay);
				} else {
					// Max attempts reached - payment still pending
					verificationInProgressRef.current = false;
					setState("error");
					const errorMessage =
						"Payment verification is taking longer than expected. Please check your email for confirmation or contact support.";
					setError(errorMessage);
					cleanup();
					onPaymentError(errorMessage);
				}
			} catch (err) {
				if (attempt < maxAttempts) {
					// Retry on error
					verificationInProgressRef.current = false;
					setState("waiting");
					const delay = Math.min(2000 * Math.pow(1.5, attempt - 1), 10000);
					setTimeout(() => {
						pollPaymentStatus(reference, attempt + 1, maxAttempts);
					}, delay);
				} else {
					verificationInProgressRef.current = false;
					setState("error");
					const errorMessage =
						err instanceof Error
							? err.message
							: "Failed to verify payment. Please contact support.";
					setError(errorMessage);
					cleanup();
					onPaymentError(errorMessage);
				}
			}
		},
		[onPaymentSuccess, onPaymentError, onClose, cleanup]
	);

	// Handle postMessage from Paystack
	const handleMessage = useCallback(
		(event: MessageEvent) => {
			if (event.data?.type === "PAYSTACK_SUCCESS" && event.data?.reference) {
				// Paystack sent success message
				window.removeEventListener("message", handleMessage);
				pollPaymentStatus(event.data.reference);
			}
		},
		[pollPaymentStatus]
	);

	// Initialize payment
	const handleInitializePayment = useCallback(async () => {
		if (!isOpen || !subaccount) {
			setError("Payment information is missing");
			setState("error");
			return;
		}

		setState("initializing");
		setError(null);
		verificationInProgressRef.current = false;

		try {
			const amountInPesewas = amount;

			// Try to create split, but don't fail if it doesn't work
			let splitCode: string | undefined;
			try {
				const splitData: CreateSplitData = {
					name: `Print Job Payment - ${Date.now()}`,
					type: "percentage",
					currency: "GHS",
					subaccounts: [
						{
							subaccount: subaccount,
							share: 93,
						},
					],
				};
				const splitResponse = await createSplit(splitData);

				console.log("splitResponse ----", splitResponse);
				if (splitResponse.status && splitResponse.data?.split_code) {
					splitCode = splitResponse.data.split_code;
				}
			} catch (splitError) {
				// Silently fall back to direct subaccount
				console.warn(
					"Split creation failed, using direct subaccount:",
					splitError
				);
			}

			// Initialize payment
			const response = await initializePayment({
				amount: amountInPesewas,
				email,
				currency: "GHS",
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
				const reference = response.data.reference;
				setPaymentReference(reference);
				setState("waiting");

				// Open Paystack payment page
				const paymentWindow = window.open(
					response.data.authorization_url,
					"PaystackPayment",
					"width=600,height=700,scrollbars=yes"
				);
				paymentWindowRef.current = paymentWindow;

				// Listen for postMessage
				window.addEventListener("message", handleMessage);

				// Monitor window close
				const checkWindow = setInterval(() => {
					if (paymentWindow?.closed) {
						clearInterval(checkWindow);
						window.removeEventListener("message", handleMessage);

						// Start polling when window closes (user completed or cancelled payment)
						if (reference && !verificationInProgressRef.current) {
							// Small delay to allow Paystack to process
							setTimeout(() => {
								pollPaymentStatus(reference);
							}, 2000);
						}
					}
				}, 500); // Check more frequently

				// Cleanup after 30 minutes
				cleanupTimeoutRef.current = window.setTimeout(() => {
					clearInterval(checkWindow);
					window.removeEventListener("message", handleMessage);
					setState("error");
					setError("Payment window timed out. Please try again.");
				}, 30 * 60 * 1000);
			} else {
				throw new Error(response.message || "Failed to initialize payment");
			}
		} catch (err) {
			setState("error");
			const errorMessage =
				err instanceof Error ? err.message : "Failed to initialize payment";
			setError(errorMessage);
			onPaymentError(errorMessage);
		}
	}, [
		isOpen,
		subaccount,
		amount,
		email,
		onPaymentError,
		handleMessage,
		pollPaymentStatus,
	]);

	// Reset on open
	useEffect(() => {
		if (isOpen) {
			setState("idle");
			setError(null);
			setPaymentReference(null);
			verificationInProgressRef.current = false;
			handleInitializePayment();
		} else {
			cleanup();
		}

		return () => {
			cleanup();
		};
	}, [isOpen, handleInitializePayment, cleanup]);

	// Prevent closing during critical operations
	const handleClose = useCallback(() => {
		if (state === "verifying" || state === "success") {
			return; // Don't allow closing during verification or success
		}
		cleanup();
		onClose();
	}, [state, cleanup, onClose]);

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 relative">
				{state !== "verifying" && state !== "success" && (
					<button
						onClick={handleClose}
						className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
						disabled={state === "initializing"}
					>
						<X className="w-5 h-5" />
					</button>
				)}

				<div className="text-center">
					{state === "initializing" && (
						<>
							<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Preparing Payment
							</h3>
							<p className="text-sm text-gray-600">
								Setting up your payment...
							</p>
						</>
					)}

					{state === "waiting" && (
						<>
							<CreditCard className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Complete Your Payment
							</h3>
							<p className="text-sm text-gray-600 mb-4">
								Please complete the payment in the popup window.
							</p>
							<p className="text-xs text-gray-500">
								Waiting for payment confirmation...
							</p>
						</>
					)}

					{state === "verifying" && (
						<>
							<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Verifying Payment
							</h3>
							<p className="text-sm text-gray-600">
								Please wait while we confirm your payment...
							</p>
						</>
					)}

					{state === "success" && (
						<>
							<CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								Payment Successful!
							</h3>
							<p className="text-sm text-gray-600">
								Your payment has been verified. Processing your order...
							</p>
						</>
					)}

					{state === "error" && error && (
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

					<div className="mt-6 pt-4 border-t border-gray-200">
						<div className="flex justify-between items-center text-sm">
							<span className="text-gray-600">Amount:</span>
							<span className="font-semibold text-gray-900">
								GHS {amount.toFixed(2)}
							</span>
						</div>
						{paymentReference && (
							<div className="flex justify-between items-center text-sm mt-2">
								<span className="text-gray-600">Reference:</span>
								<span className="font-mono text-xs text-gray-500">
									{paymentReference}
								</span>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

import { useState, useCallback, useRef } from "react";
import {
	initializePayment,
	verifyPayment,
	// createSplit, // Uncomment if you need split payments
	// type CreateSplitData, // Uncomment if you need split payments
} from "../services/paystackService";

interface PaymentData {
	reference: string;
	amount: number; // Amount in GHS (already converted from pesewas)
}

interface UsePaymentProps {
	amount: number;
	email: string;
	subaccount: string;
	onPaymentSuccess: (paymentData: PaymentData) => void;
	onPaymentError: (error: string) => void;
}

export const usePayment = ({
	amount,
	email,
	subaccount,
	onPaymentSuccess,
	onPaymentError,
}: UsePaymentProps) => {
	const [loading, setLoading] = useState(false);
	const [verifying, setVerifying] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const hasVerifiedRef = useRef(false);
	const paymentWindowRef = useRef<Window | null>(null);
	const messageHandlerRef = useRef<((event: MessageEvent) => void) | null>(
		null
	);
	const windowCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null
	);
	const cleanupTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const cleanupListeners = useCallback(() => {
		if (messageHandlerRef.current) {
			window.removeEventListener("message", messageHandlerRef.current);
			messageHandlerRef.current = null;
		}
		// Clear window check interval
		if (windowCheckIntervalRef.current) {
			clearInterval(windowCheckIntervalRef.current);
			windowCheckIntervalRef.current = null;
		}
		// Clear cleanup timeout
		if (cleanupTimeoutRef.current) {
			clearTimeout(cleanupTimeoutRef.current);
			cleanupTimeoutRef.current = null;
		}
	}, []);

	const verifyPaymentStatus = useCallback(
		async (reference: string) => {
			if (hasVerifiedRef.current) {
				return;
			}

			hasVerifiedRef.current = true;
			setVerifying(true);
			setError(null);
			cleanupListeners();

			try {
				const response = await verifyPayment(reference);

				if (response.status && response.data?.status === "success") {
					// Pass payment data including amount
					const paymentData: PaymentData = {
						reference,
						amount: response.data.amount || 0, // Amount is already converted from pesewas/kobo to main currency unit
					};
					onPaymentSuccess(paymentData);
				} else {
					throw new Error(response.message || "Payment verification failed");
				}
			} catch (err) {
				const errorMessage =
					err instanceof Error
						? err.message
						: "Failed to verify payment. Please contact support.";
				setError(errorMessage);
				onPaymentError(errorMessage);
				hasVerifiedRef.current = false;
			} finally {
				setVerifying(false);
			}
		},
		[onPaymentSuccess, onPaymentError, cleanupListeners]
	);

	const createMessageHandler = useCallback(
		(verifyFn: (reference: string) => Promise<void>) => {
			const processedReferences = new Set<string>(); // Track processed references

			const handleMessage = (event: MessageEvent) => {
				// Security check: verify origin
				if (event.origin !== window.location.origin) {
					return;
				}

				// Prevent duplicate processing
				if (hasVerifiedRef.current) {
					return;
				}

				const reference = event.data?.reference;
				if (!reference) {
					return;
				}

				// Prevent processing the same reference multiple times
				if (processedReferences.has(reference)) {
					return;
				}

				if (event.data?.type === "PAYSTACK_SUCCESS" && reference) {
					processedReferences.add(reference);
					hasVerifiedRef.current = true;
					cleanupListeners();

					// If amount is provided in the message, use it directly to avoid re-verification
					if (
						event.data?.amount !== undefined &&
						typeof event.data.amount === "number"
					) {
						const paymentData: PaymentData = {
							reference,
							amount: event.data.amount,
						};
						setVerifying(false);
						setLoading(false);
						onPaymentSuccess(paymentData);
					} else {
						// Fallback to verification if amount not provided
						verifyFn(reference);
					}
				} else if (event.data?.type === "PAYSTACK_FAILED" && reference) {
					processedReferences.add(reference);
					cleanupListeners();
					const errorMessage =
						event.data.status === "abandoned"
							? "Payment was cancelled. Please try again if you want to complete the payment."
							: "Payment failed. Please try again.";
					setError(errorMessage);
					onPaymentError(errorMessage);
					setLoading(false);
				} else if (event.data?.type === "PAYSTACK_ERROR" && reference) {
					processedReferences.add(reference);
					cleanupListeners();
					setError("Payment verification failed. Please contact support.");
					onPaymentError(
						"Payment verification failed. Please contact support."
					);
					setLoading(false);
				}
			};
			return handleMessage;
		},
		[cleanupListeners, onPaymentError, onPaymentSuccess]
	);

	const initialize = useCallback(async () => {
		if (!subaccount) {
			setError("Payment information is missing");
			return;
		}

		// Prevent multiple initializations - if window is already open, don't open another
		// But only if the window is actually still open (not closed)
		if (paymentWindowRef.current) {
			if (!paymentWindowRef.current.closed) {
				// Window is already open, just focus it
				paymentWindowRef.current.focus();
				return;
			} else {
				// Window was closed, clear the ref so we can open a new one
				paymentWindowRef.current = null;
			}
		}

		hasVerifiedRef.current = false;
		setLoading(true);
		setError(null);
		cleanupListeners();

		try {
			// Remove split creation - it's not being used and may cause issues
			// If you need split payments, uncomment and use the split_code
			// const splitData: CreateSplitData = {
			// 	name: `Print Job Payment - ${new Date().toISOString()}`,
			// 	type: "percentage",
			// 	currency: "GHS", // Match the currency your subaccount is configured for
			// 	subaccounts: [
			// 		{
			// 			subaccount: subaccount,
			// 			share: 98.5,
			// 		},
			// 	],
			// 	bearer_type: "subaccount",
			// };

			// let splitCode: string | undefined;
			// try {
			// 	const splitResponse = await createSplit(splitData);
			// 	if (splitResponse.status && splitResponse.data?.split_code) {
			// 		splitCode = splitResponse.data.split_code;
			// 	}
			// } catch (splitError) {
			// 	console.warn(
			// 		"Failed to create split, using direct subaccount:",
			// 		splitError
			// 	);
			// }

			const callbackUrl = `${window.location.origin}/payment/callback`;

			const response = await initializePayment({
				amount,
				email,
				currency: "GHS", // Ghanaian Cedis
				subaccount: subaccount,
				// split_code: splitCode, // Use split_code if you want split payments
				callback_url: callbackUrl,
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
				// Use a unique window name to prevent browser from reusing closed windows
				const windowName = `PaystackPayment_${Date.now()}`;
				paymentWindowRef.current = window.open(
					response.data.authorization_url,
					windowName,
					"width=600,height=700,scrollbars=yes"
				);

				// Check if popup was blocked
				if (!paymentWindowRef.current || paymentWindowRef.current.closed) {
					throw new Error(
						"Payment window was blocked. Please allow popups for this site and try again."
					);
				}

				// Only add listener if window was opened successfully
				const handleMessage = createMessageHandler(verifyPaymentStatus);
				messageHandlerRef.current = handleMessage;
				window.addEventListener("message", handleMessage, false);

				// Cleanup after 30 minutes
				cleanupTimeoutRef.current = setTimeout(() => {
					cleanupListeners();
				}, 30 * 60 * 1000);

				// Check if window is closed periodically and cleanup
				windowCheckIntervalRef.current = setInterval(() => {
					if (paymentWindowRef.current?.closed) {
						cleanupListeners();
						paymentWindowRef.current = null; // Clear the ref when window closes
					}
				}, 1000);
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
	}, [
		subaccount,
		amount,
		email,
		onPaymentError,
		verifyPaymentStatus,
		createMessageHandler,
		cleanupListeners,
	]);

	const reset = useCallback(() => {
		cleanupListeners();
		hasVerifiedRef.current = false;
		setError(null);
		// Close payment window if still open
		if (paymentWindowRef.current && !paymentWindowRef.current.closed) {
			paymentWindowRef.current.close();
		}
		paymentWindowRef.current = null;
	}, [cleanupListeners]);

	return {
		loading,
		verifying,
		error,
		initialize,
		reset,
		setError,
	};
};


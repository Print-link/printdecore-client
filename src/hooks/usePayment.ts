import { useState, useCallback, useRef } from "react";
import { initializePayment, verifyPayment } from "../services/paystackService";

interface PaymentData {
	reference: string;
	amount: number;
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
		if (windowCheckIntervalRef.current) {
			clearInterval(windowCheckIntervalRef.current);
			windowCheckIntervalRef.current = null;
		}
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
					const paymentData: PaymentData = {
						reference,
						amount: response.data.amount || 0,
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
			const processedReferences = new Set<string>();

			const handleMessage = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) {
					return;
				}

				if (hasVerifiedRef.current) {
					return;
				}

				const reference = event.data?.reference;
				if (!reference) {
					return;
				}

				if (processedReferences.has(reference)) {
					return;
				}

				if (event.data?.type === "PAYSTACK_SUCCESS" && reference) {
					processedReferences.add(reference);
					hasVerifiedRef.current = true;
					cleanupListeners();

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

		if (paymentWindowRef.current) {
			if (!paymentWindowRef.current.closed) {
				paymentWindowRef.current.focus();
				return;
			} else {
				paymentWindowRef.current = null;
			}
		}

		hasVerifiedRef.current = false;
		setLoading(true);
		setError(null);
		cleanupListeners();

		try {
			const callbackUrl = `${window.location.origin}/payment/callback`;

			const response = await initializePayment({
				amount,
				email,
				currency: "GHS",
				subaccount: subaccount,
				callback_url: callbackUrl,
				bearer: "subaccount",
				bearer_subaccount: subaccount,
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
				const windowName = `PaystackPayment_${Date.now()}`;
				paymentWindowRef.current = window.open(
					response.data.authorization_url,
					windowName,
					"width=600,height=700,scrollbars=yes"
				);

				if (!paymentWindowRef.current || paymentWindowRef.current.closed) {
					throw new Error(
						"Payment window was blocked. Please allow popups for this site and try again."
					);
				}

				const handleMessage = createMessageHandler(verifyPaymentStatus);
				messageHandlerRef.current = handleMessage;
				window.addEventListener("message", handleMessage, false);

				cleanupTimeoutRef.current = setTimeout(() => {
					cleanupListeners();
				}, 30 * 60 * 1000);

				windowCheckIntervalRef.current = setInterval(() => {
					if (paymentWindowRef.current?.closed) {
						cleanupListeners();
						paymentWindowRef.current = null;
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


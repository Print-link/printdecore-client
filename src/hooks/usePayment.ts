import { useState, useCallback, useRef } from "react";
import {
	initializePayment,
	verifyPayment,
	createSplit,
	type CreateSplitData,
} from "../services/paystackService";

interface UsePaymentProps {
	amount: number;
	email: string;
	subaccount: string;
	onPaymentSuccess: (reference: string) => void;
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

	const cleanupListeners = useCallback(() => {
		if (messageHandlerRef.current) {
			window.removeEventListener("message", messageHandlerRef.current);
			messageHandlerRef.current = null;
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
					onPaymentSuccess(reference);
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
			const handleMessage = (event: MessageEvent) => {
				if (event.origin !== window.location.origin) {
					return;
				}

				if (hasVerifiedRef.current) {
					return;
				}

				if (
					event.data?.type === "PAYSTACK_SUCCESS" &&
					event.data?.reference
				) {
					cleanupListeners();
					verifyFn(event.data.reference);
				} else if (
					event.data?.type === "PAYSTACK_FAILED" &&
					event.data?.reference
				) {
					cleanupListeners();
					const errorMessage =
						event.data.status === "abandoned"
							? "Payment was cancelled. Please try again if you want to complete the payment."
							: "Payment failed. Please try again.";
					setError(errorMessage);
					onPaymentError(errorMessage);
					setLoading(false);
				} else if (event.data?.type === "PAYSTACK_ERROR") {
					cleanupListeners();
					setError("Payment verification failed. Please contact support.");
					onPaymentError("Payment verification failed. Please contact support.");
					setLoading(false);
				}
			};
			return handleMessage;
		},
		[cleanupListeners, onPaymentError]
	);

	const initialize = useCallback(async () => {
		if (!subaccount) {
			setError("Payment information is missing");
			return;
		}

		hasVerifiedRef.current = false;
		setLoading(true);
		setError(null);
		cleanupListeners();

		try {
			const splitData: CreateSplitData = {
				name: `Print Job Payment - ${new Date().toISOString()}`,
				type: "percentage",
				currency: "GHS",
				subaccounts: [
					{
						subaccount: subaccount,
						share: 93,
					},
				],
				bearer_type: "account",
			};

			let splitCode: string | undefined;
			try {
				const splitResponse = await createSplit(splitData);
				if (splitResponse.status && splitResponse.data?.split_code) {
					splitCode = splitResponse.data.split_code;
				}
			} catch (splitError) {
				console.warn("Failed to create split, using direct subaccount:", splitError);
			}

			const callbackUrl = `${window.location.origin}/payment/callback`;

			const response = await initializePayment({
				amount,
				email,
				currency: "GHS",
				...(splitCode ? { split_code: splitCode } : { subaccount }),
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
				paymentWindowRef.current = window.open(
					response.data.authorization_url,
					"PaystackPayment",
					"width=600,height=700,scrollbars=yes"
				);

				const handleMessage = createMessageHandler(verifyPaymentStatus);
				messageHandlerRef.current = handleMessage;
				window.addEventListener("message", handleMessage);

				setTimeout(() => {
					cleanupListeners();
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


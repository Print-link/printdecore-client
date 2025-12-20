import { useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { verifyPayment } from "../services/paystackService";

export const PaymentCallback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const hasProcessedRef = useRef(false); // Prevent multiple processing
	const processingRef = useRef(false); // Prevent concurrent processing

	// Extract reference once and memoize to prevent unnecessary rerenders
	const paymentReference = useMemo(() => {
		return searchParams.get("reference") || searchParams.get("trxref");
	}, [searchParams]);

	useEffect(() => {
		// Prevent multiple executions - check both refs
		if (hasProcessedRef.current || processingRef.current || !paymentReference) {
			return;
		}

		processingRef.current = true;
		hasProcessedRef.current = true;

		const handlePaymentCallback = async () => {
			try {
				// Verify payment
				const response = await verifyPayment(paymentReference);

				if (response.status && response.data?.status === "success") {
					// Payment successful - send message to parent window if opened from modal
					// Include amount to avoid re-verification
					if (window.opener && !window.opener.closed) {
						window.opener.postMessage(
							{
								type: "PAYSTACK_SUCCESS",
								reference: paymentReference,
								amount: response.data.amount || 0, // Include amount from verification
							},
							window.location.origin
						);
						// Close this window
						setTimeout(() => {
							if (!window.closed) {
								window.close();
							}
						}, 1500);
					} else {
						// Opened in same window, redirect to home
						setTimeout(() => {
							navigate("/", { replace: true });
						}, 2000);
					}
				} else {
					// Payment failed or pending
					if (window.opener && !window.opener.closed) {
						window.opener.postMessage(
							{
								type: "PAYSTACK_FAILED",
								reference: paymentReference,
								status: response.data?.status,
							},
							window.location.origin
						);
						setTimeout(() => {
							if (!window.closed) {
								window.close();
							}
						}, 2000);
					} else {
						setTimeout(() => {
							navigate("/", { replace: true });
						}, 2000);
					}
				}
			} catch (error) {
				console.error("Payment verification error:", error);
				if (window.opener && !window.opener.closed) {
					window.opener.postMessage(
						{
							type: "PAYSTACK_ERROR",
							reference: paymentReference,
						},
						window.location.origin
					);
					setTimeout(() => {
						if (!window.closed) {
							window.close();
						}
					}, 2000);
				} else {
					setTimeout(() => {
						navigate("/", { replace: true });
					}, 2000);
				}
			} finally {
				processingRef.current = false;
			}
		};

		handlePaymentCallback();
	}, [paymentReference, navigate]); // Only depend on memoized reference and stable navigate

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg max-w-md w-full p-6 text-center">
				{paymentReference ? (
					<>
						<Loader2 className="w-12 h-12 text-[#63A361] animate-spin mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Verifying Payment
						</h3>
						<p className="text-sm text-gray-600">
							Please wait while we verify your payment...
						</p>
						{paymentReference && (
							<p className="text-xs text-gray-500 mt-2">
								Reference: {paymentReference}
							</p>
						)}
					</>
				) : (
					<>
						<AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							No Payment Reference
						</h3>
						<p className="text-sm text-gray-600">Redirecting you back...</p>
					</>
				)}
			</div>
		</div>
	);
};


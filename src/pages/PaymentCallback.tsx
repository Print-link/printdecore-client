import { useEffect, useRef, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SpinnerGap, WarningCircle } from "@phosphor-icons/react";
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
			const returnUrl = sessionStorage.getItem("payment_return_url");
			const fallbackUrl = returnUrl || "/";

			const redirectSameWindow = (url: string, delay = 1500) => {
				sessionStorage.removeItem("payment_return_url");
				setTimeout(() => navigate(url, { replace: true }), delay);
			};

			try {
				// Verify payment
				const response = await verifyPayment(paymentReference);

				if (response.status && response.data?.status === "success") {
					if (window.opener && !window.opener.closed) {
						window.opener.postMessage(
							{
								type: "PAYSTACK_SUCCESS",
								reference: paymentReference,
								amount: response.data.amount || 0,
							},
							window.location.origin
						);
						setTimeout(() => {
							if (!window.closed) window.close();
						}, 1500);
					} else {
						redirectSameWindow(fallbackUrl);
					}
				} else {
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
							if (!window.closed) window.close();
						}, 2000);
					} else {
						redirectSameWindow(fallbackUrl, 2000);
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
						if (!window.closed) window.close();
					}, 2000);
				} else {
					redirectSameWindow(fallbackUrl, 2000);
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
						<SpinnerGap size={48} weight="bold" className="text-brand-ink animate-spin mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-ink mb-2">
							Verifying Payment
						</h3>
						<p className="text-sm text-ink-2">
							Please wait while we verify your payment...
						</p>
						{paymentReference && (
							<p className="text-xs text-ink-2 mt-2">
								Reference: {paymentReference}
							</p>
						)}
					</>
				) : (
					<>
						<WarningCircle size={48} weight="regular" className="text-brand-ink mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-ink mb-2">
							No Payment Reference
						</h3>
						<p className="text-sm text-ink-2">Redirecting you back...</p>
					</>
				)}
			</div>
		</div>
	);
};


import { useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle } from "lucide-react";
import { verifyPayment } from "../services/paystackService";

export const PaymentCallback = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const reference = searchParams.get("reference");
	const trxref = searchParams.get("trxref"); // Paystack sometimes uses trxref
	const hasProcessedRef = useRef(false); // Prevent multiple processing

	useEffect(() => {
		const handlePaymentCallback = async () => {
			// Prevent multiple executions
			if (hasProcessedRef.current) {
				return;
			}
			hasProcessedRef.current = true;
			// Use reference or trxref (Paystack uses both)
			const paymentReference = reference || trxref;

			if (!paymentReference) {
				// No reference, redirect to home
				setTimeout(() => {
					navigate("/");
				}, 2000);
				return;
			}

			// Verify payment
			try {
				const response = await verifyPayment(paymentReference);

				if (response.status && response.data?.status === "success") {
					// Payment successful - send message to parent window if opened from modal
					if (window.opener) {
						window.opener.postMessage(
							{
								type: "PAYSTACK_SUCCESS",
								reference: paymentReference,
							},
							window.location.origin
						);
						// Close this window
						setTimeout(() => {
							window.close();
						}, 1500);
					} else {
						// Opened in same window, redirect to home
						setTimeout(() => {
							navigate("/");
						}, 2000);
					}
				} else {
					// Payment failed or pending
					if (window.opener) {
						window.opener.postMessage(
							{
								type: "PAYSTACK_FAILED",
								reference: paymentReference,
								status: response.data?.status,
							},
							window.location.origin
						);
						setTimeout(() => {
							window.close();
						}, 2000);
					} else {
						setTimeout(() => {
							navigate("/");
						}, 2000);
					}
				}
			} catch (error) {
				console.error("Payment verification error:", error);
				if (window.opener) {
					window.opener.postMessage(
						{
							type: "PAYSTACK_ERROR",
							reference: paymentReference,
						},
						window.location.origin
					);
					setTimeout(() => {
						window.close();
					}, 2000);
				} else {
					setTimeout(() => {
						navigate("/");
					}, 2000);
				}
			}
		};

		handlePaymentCallback();
	}, [reference, trxref, navigate]);

	return (
		<div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
			<div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
				{reference || trxref ? (
					<>
						<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
						<h3 className="text-lg font-semibold text-gray-900 mb-2">
							Verifying Payment
						</h3>
						<p className="text-sm text-gray-600">
							Please wait while we verify your payment...
						</p>
						{reference && (
							<p className="text-xs text-gray-500 mt-2">
								Reference: {reference}
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


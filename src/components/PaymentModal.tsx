import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { usePayment } from "../hooks/usePayment";
import { PaymentModalContent } from "./PaymentModalContent";

interface PaymentData {
	reference: string;
	amount: number;
}

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	amount: number;
	email: string;
	subaccount: string;
	currency?: string; // Optional currency, will be auto-detected from user profile if not provided
	country?: string; // Optional country for currency detection
	onPaymentSuccess: (paymentData: PaymentData) => void;
	onPaymentError: (error: string) => void;
}

export const PaymentModal = ({
	isOpen,
	onClose,
	amount,
	email,
	subaccount,
	currency,
	country,
	onPaymentSuccess,
	onPaymentError,
}: PaymentModalProps) => {
	const hasInitializedRef = useRef(false);
	const { loading, verifying, error, initialize, reset, setError } = usePayment(
		{
			amount,
			email,
			subaccount,
			currency,
			country,
			onPaymentSuccess: (paymentData) => {
				onPaymentSuccess(paymentData);
				setTimeout(() => {
					onClose();
				}, 2000);
			},
			onPaymentError,
		}
	);

	useEffect(() => {
		if (isOpen) {
			// Reset initialization flag when modal opens to allow fresh initialization
			if (!hasInitializedRef.current) {
				hasInitializedRef.current = true;
				setError(null);
				initialize();
			}
		} else {
			// Reset when modal closes to allow re-initialization next time
			hasInitializedRef.current = false;
			reset();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen]); // Only depend on isOpen to prevent multiple initializations

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
			<div className="bg-white rounded-lg max-w-md w-full p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
					disabled={loading || verifying}
				>
					<X className="w-5 h-5" />
				</button>
				<PaymentModalContent
					loading={loading}
					verifying={verifying}
					error={error}
					amount={amount}
					onRetry={initialize}
				/>
			</div>
		</div>
	);
};

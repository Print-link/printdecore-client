import { useEffect } from "react";
import { X } from "lucide-react";
import { usePayment } from "../hooks/usePayment";
import { PaymentModalContent } from "./PaymentModalContent";

interface PaymentModalProps {
	isOpen: boolean;
	onClose: () => void;
	amount: number;
	email: string;
	subaccount: string;
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
	const { loading, verifying, error, initialize, reset, setError } = usePayment(
		{
			amount,
			email,
			subaccount,
			onPaymentSuccess: (reference) => {
				onPaymentSuccess(reference);
				setTimeout(() => {
					onClose();
				}, 2000);
			},
			onPaymentError,
		}
	);

	useEffect(() => {
		if (isOpen) {
			setError(null);
			initialize();
		} else {
			reset();
		}
	}, [isOpen, initialize, reset, setError]);

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

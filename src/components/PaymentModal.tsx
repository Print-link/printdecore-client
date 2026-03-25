import { useEffect, useRef } from "react";
import { X } from "@phosphor-icons/react";
import { usePayment } from "../hooks/usePayment";
import { PaymentModalContent } from "./PaymentModalContent";
import type { PendingCartItem } from "../services/paystackService";

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
	currency?: string;
	country?: string;
	onPaymentSuccess: (paymentData: PaymentData) => void;
	onPaymentError: (error: string) => void;
	// Pending payment context for webhook recovery
	clientId?: string;
	branchId?: string;
	totalPrice?: number;
	cartItems?: PendingCartItem[];
	comment?: string;
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
	clientId,
	branchId,
	totalPrice,
	cartItems,
	comment,
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
			clientId,
			branchId,
			totalPrice,
			cartItems,
			comment,
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
			<div className="bg-white dark:bg-[#1e1e1e] rounded-lg max-w-md w-full p-6 relative">
				<button
					onClick={onClose}
					className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
					disabled={loading || verifying}
				>
					<X size={20} weight="bold" />
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

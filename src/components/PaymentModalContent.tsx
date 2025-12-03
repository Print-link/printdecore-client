import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface PaymentModalContentProps {
	loading: boolean;
	verifying: boolean;
	error: string | null;
	amount: number;
	onRetry: () => void;
}

export const PaymentModalContent = ({
	loading,
	verifying,
	error,
	amount,
	onRetry,
}: PaymentModalContentProps) => {
	return (
		<div className="text-center">
			{loading && (
				<>
					<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Initializing Payment
					</h3>
					<p className="text-sm text-gray-600">Redirecting to Paystack...</p>
				</>
			)}

			{verifying && (
				<>
					<Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Verifying Payment
					</h3>
					<p className="text-sm text-gray-600">
						Please wait while we verify your payment...
					</p>
				</>
			)}

			{error && !loading && !verifying && (
				<>
					<AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Payment Error
					</h3>
					<p className="text-sm text-red-600 mb-4">{error}</p>
					<button
						onClick={onRetry}
						className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
					>
						Try Again
					</button>
				</>
			)}

			{!loading && !verifying && !error && (
				<>
					<CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 mb-2">
						Payment Successful
					</h3>
					<p className="text-sm text-gray-600">
						Your payment has been verified. Processing your order...
					</p>
				</>
			)}

			<div className="mt-6 pt-4 border-t border-gray-200">
				<div className="flex justify-between items-center text-sm">
					<span className="text-gray-600">Amount:</span>
					<span className="font-semibold text-gray-900">
						GHS {amount.toFixed(2)}
					</span>
				</div>
			</div>
		</div>
	);
};


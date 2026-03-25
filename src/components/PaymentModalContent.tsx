import { SpinnerGap, CheckCircle, WarningCircle } from "@phosphor-icons/react";

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
					<SpinnerGap size={48} weight="bold" className="text-[#fbbf24] animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Initializing Payment
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">Redirecting to Paystack...</p>
				</>
			)}

			{verifying && (
				<>
					<SpinnerGap size={48} weight="bold" className="text-[#fbbf24] animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Verifying Payment
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Please wait while we verify your payment...
					</p>
				</>
			)}

			{error && !loading && !verifying && (
				<>
					<WarningCircle size={48} weight="duotone" className="text-red-600 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Payment Error
					</h3>
					<p className="text-sm text-red-600 mb-4">{error}</p>
					<button
						onClick={onRetry}
						className="px-4 py-2 bg-[#fbbf24] text-white rounded-lg hover:bg-[#fbbf24] transition-colors"
					>
						Try Again
					</button>
				</>
			)}

			{!loading && !verifying && !error && (
				<>
					<CheckCircle size={48} weight="duotone" className="text-green-600 mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
						Payment Successful
					</h3>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						Your payment has been verified. Processing your order...
					</p>
				</>
			)}

			<div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
				<div className="flex justify-between items-center text-sm">
					<span className="text-gray-600 dark:text-gray-400">Amount:</span>
					<span className="font-semibold text-gray-900 dark:text-white">
						GHS {amount?.toFixed(2)}
					</span>
				</div>
			</div>
		</div>
	);
};


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
					<SpinnerGap size={48} weight="bold" className="text-brand-ink animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-ink mb-2">
						Initializing Payment
					</h3>
					<p className="text-sm text-ink-2">Redirecting to Paystack...</p>
				</>
			)}

			{verifying && (
				<>
					<SpinnerGap size={48} weight="bold" className="text-brand-ink animate-spin mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-ink mb-2">
						Verifying Payment
					</h3>
					<p className="text-sm text-ink-2">
						Please wait while we verify your payment...
					</p>
				</>
			)}

			{error && !loading && !verifying && (
				<>
					<WarningCircle size={48} weight="regular" className="text-bad mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-ink mb-2">
						Payment Error
					</h3>
					<p className="text-sm text-bad mb-4">{error}</p>
					<button
						onClick={onRetry}
						className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand transition-colors"
					>
						Try Again
					</button>
				</>
			)}

			{!loading && !verifying && !error && (
				<>
					<CheckCircle size={48} weight="regular" className="text-ok mx-auto mb-4" />
					<h3 className="text-lg font-semibold text-ink mb-2">
						Payment Successful
					</h3>
					<p className="text-sm text-ink-2">
						Your payment has been verified. Processing your order...
					</p>
				</>
			)}

			<div className="mt-6 pt-4 border-t border-line">
				<div className="flex justify-between items-center text-sm">
					<span className="text-ink-2">Amount:</span>
					<span className="font-semibold text-ink">
						GHS {amount?.toFixed(2)}
					</span>
				</div>
			</div>
		</div>
	);
};


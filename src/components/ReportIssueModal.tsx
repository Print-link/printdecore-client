import { useState } from "react";
import { X, WarningCircle, PaperPlaneTilt } from "@phosphor-icons/react";

interface ReportIssueModalProps {
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (message: string) => Promise<void>;
	loading?: boolean;
}

export const ReportIssueModal = ({
	isOpen,
	onClose,
	onSubmit,
	loading = false,
}: ReportIssueModalProps) => {
	const [message, setMessage] = useState("");
	const [error, setError] = useState<string | null>(null);

	if (!isOpen) return null;

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);

		if (!message.trim()) {
			setError("Please enter a message");
			return;
		}

		try {
			await onSubmit(message.trim());
			setMessage("");
			onClose();
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Failed to submit support ticket"
			);
		}
	};

	const handleClose = () => {
		if (!loading) {
			setMessage("");
			setError(null);
			onClose();
		}
	};

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
			<div className="bg-surface rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-line">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-bad-tint rounded-lg flex items-center justify-center">
							<WarningCircle size={20} weight="regular" className="text-bad" />
						</div>
						<div>
							<h2 className="text-lg sm:text-xl font-semibold text-ink">
								Report Issue
							</h2>
							<p className="text-xs sm:text-sm text-ink-2">
								Describe the issue you're experiencing
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						disabled={loading}
						className="p-2 text-ink-3 hover:text-ink dark:hover:text-ink-3 hover:bg-fill rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Close modal"
					>
						<X size={20} weight="bold" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="p-4 sm:p-6">
					{error && (
						<div className="mb-4 p-3 bg-bad-tint rounded-lg flex items-start gap-2">
							<WarningCircle size={20} weight="regular" className="text-bad shrink-0 mt-0.5" />
							<p className="text-sm text-bad">{error}</p>
						</div>
					)}

					<div className="mb-4 sm:mb-6">
						<label
							htmlFor="message"
							className="block text-sm font-medium text-ink mb-2"
						>
							Message *
						</label>
						<textarea
							id="message"
							value={message}
							onChange={(e) => {
								setMessage(e.target.value);
								setError(null);
							}}
							placeholder="Please describe the issue you're experiencing with this order..."
							rows={6}
							className="w-full px-3 py-3 text-base bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink resize-none"
							required
							disabled={loading}
						/>
						<p className="mt-1.5 text-xs text-ink-2">
							Your message will be sent to the print station administrator
						</p>
					</div>

					{/* Actions */}
					<div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							disabled={loading}
							className="px-4 py-2.5 text-sm font-medium text-ink bg-fill rounded-lg hover:bg-fill-press transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !message.trim()}
							className="px-4 py-2.5 text-sm font-medium text-white bg-brand rounded-lg hover:bg-brand transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Submitting...
								</>
							) : (
								<>
									<PaperPlaneTilt size={16} weight="bold" />
									Submit Report
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};


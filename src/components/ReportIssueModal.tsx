import { useState } from "react";
import { X, AlertCircle, Send } from "lucide-react";

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
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
			<div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
				{/* Header */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
							<AlertCircle className="w-5 h-5 text-red-600" />
						</div>
						<div>
							<h2 className="text-lg sm:text-xl font-semibold text-gray-900">
								Report Issue
							</h2>
							<p className="text-xs sm:text-sm text-gray-500">
								Describe the issue you're experiencing
							</p>
						</div>
					</div>
					<button
						onClick={handleClose}
						disabled={loading}
						className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						aria-label="Close modal"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				{/* Content */}
				<form onSubmit={handleSubmit} className="p-4 sm:p-6">
					{error && (
						<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
							<AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
							<p className="text-sm text-red-800">{error}</p>
						</div>
					)}

					<div className="mb-4 sm:mb-6">
						<label
							htmlFor="message"
							className="block text-sm font-medium text-gray-700 mb-2"
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
							className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent resize-none"
							required
							disabled={loading}
						/>
						<p className="mt-1.5 text-xs text-gray-500">
							Your message will be sent to the print station administrator
						</p>
					</div>

					{/* Actions */}
					<div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
						<button
							type="button"
							onClick={handleClose}
							disabled={loading}
							className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={loading || !message.trim()}
							className="px-4 py-2.5 text-sm font-medium text-white bg-[#63A361] rounded-lg hover:bg-[#63A361] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
						>
							{loading ? (
								<>
									<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Submitting...
								</>
							) : (
								<>
									<Send className="w-4 h-4" />
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


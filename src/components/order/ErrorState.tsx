import { useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle } from "lucide-react";

interface ErrorStateProps {
	error?: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
	const navigate = useNavigate();

	return (
		<div className="w-full max-w-4xl mx-auto bg-white p-4 lg:p-8">
			<button
				onClick={() => navigate("/history")}
				className="mb-4 flex items-center text-sm text-gray-600 hover:text-[#fbbf24] transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to History
			</button>
			<div className="text-center py-12">
				<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
				<h2 className="text-xl font-semibold text-gray-900 mb-2">
					{error || "Order Not Found"}
				</h2>
				<p className="text-gray-600 mb-4">
					{error || "The order you're looking for doesn't exist."}
				</p>
				<button
					onClick={() => navigate("/history")}
					className="inline-flex items-center px-4 py-2 bg-[#fbbf24] text-white rounded-lg hover:bg-[#d97706] transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to History
				</button>
			</div>
		</div>
	);
};


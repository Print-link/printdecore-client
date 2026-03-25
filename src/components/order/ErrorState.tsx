import { useNavigate } from "react-router-dom";
import { ArrowLeft, WarningDiamond } from "@phosphor-icons/react";

interface ErrorStateProps {
	error?: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
	const navigate = useNavigate();

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Breadcrumb */}
			<nav className="flex items-center gap-2 text-sm mb-6">
				<button
					onClick={() => navigate("/home/history")}
					className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors font-medium"
				>
					<ArrowLeft size={16} weight="bold" />
					Orders
				</button>
			</nav>

			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
				<div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-5">
					<WarningDiamond size={28} weight="duotone" className="text-red-500" />
				</div>
				<h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
					{error ? "Something went wrong" : "Order Not Found"}
				</h2>
				<p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
					{error || "The order you're looking for doesn't exist or may have been removed."}
				</p>
				<button
					onClick={() => navigate("/home/history")}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold"
				>
					<ArrowLeft size={16} weight="bold" />
					Back to Orders
				</button>
			</div>
		</div>
	);
};

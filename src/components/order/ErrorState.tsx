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
					className="flex items-center gap-1.5 text-ink-2 hover:text-ink transition-colors font-medium"
				>
					<ArrowLeft size={16} weight="bold" />
					Orders
				</button>
			</nav>

			<div className="py-5 border-t border-line text-center">
				<div className="w-14 h-14 rounded-xl bg-bad-tint flex items-center justify-center mx-auto mb-5">
					<WarningDiamond size={28} weight="regular" className="text-bad" />
				</div>
				<h2 className="text-xl font-bold text-ink mb-2">
					{error ? "Something went wrong" : "Order Not Found"}
				</h2>
				<p className="text-ink-2 mb-6 max-w-sm mx-auto text-sm leading-relaxed">
					{error || "The order you're looking for doesn't exist or may have been removed."}
				</p>
				<button
					onClick={() => navigate("/home/history")}
					className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-page rounded-xl transition-all duration-200 text-sm font-semibold"
				>
					<ArrowLeft size={16} weight="bold" />
					Back to Orders
				</button>
			</div>
		</div>
	);
};

import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";

/** A page's title with a back button */
export const PageHeader = ({ title, subtitle, back = true, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) => {
	const navigate = useNavigate();
	return (
		<div className="flex items-start gap-3 mb-6">
			{back && (
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mt-1 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
					aria-label="Back"
				>
					<ArrowLeft size={18} />
				</button>
			)}
			<div className="flex-1 min-w-0">
				<h1 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{title}</h1>
				{subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
			</div>
			{right}
		</div>
	);
};

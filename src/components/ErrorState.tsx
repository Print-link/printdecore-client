import { WarningCircle } from "@phosphor-icons/react";

interface ErrorStateProps {
	error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
	return (
		<div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl p-8">
			<div className="text-center py-12">
				<WarningCircle size={48} weight="duotone" className="text-red-500 mx-auto mb-4" />
				<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
					Error Loading Print Stations
				</h2>
				<p className="text-gray-600 dark:text-gray-400">{error}</p>
			</div>
		</div>
	);
};


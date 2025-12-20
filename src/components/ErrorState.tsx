import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
	error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
	return (
		<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
			<div className="text-center py-12">
				<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
				<h2 className="text-xl font-semibold text-gray-900 mb-2">
					Error Loading Print Stations
				</h2>
				<p className="text-gray-600">{error}</p>
			</div>
		</div>
	);
};


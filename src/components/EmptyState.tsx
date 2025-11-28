import { Printer, Search } from "lucide-react";

interface EmptyStateProps {
	type: "no-stations" | "no-results";
	onClearSearch?: () => void;
}

export const EmptyState = ({ type, onClearSearch }: EmptyStateProps) => {
	if (type === "no-stations") {
		return (
			<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
				<Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600">
					No print stations available at the moment.
				</p>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
			<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
			<p className="text-gray-600 mb-2">
				No print stations found matching your search.
			</p>
			{onClearSearch && (
				<button
					onClick={onClearSearch}
					className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
				>
					Clear search
				</button>
			)}
		</div>
	);
};


import { Printer, Search, Tag } from "lucide-react";

interface EmptyStateProps {
	type: "no-stations" | "no-results" | "no-categories";
	onClearSearch?: () => void;
	message?: string;
}

export const EmptyState = ({ type, onClearSearch, message }: EmptyStateProps) => {
	if (type === "no-stations") {
		return (
			<div className="bg-white p-8 text-center">
				<Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600">
					No print stations available at the moment.
				</p>
			</div>
		);
	}

	if (type === "no-categories") {
		return (
			<div className="bg-white rounded-2xl p-8 text-center">
				<Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
				<p className="text-gray-600 mb-2">
					{message || "No categories found matching your search."}
				</p>
				{onClearSearch && (
					<button
						onClick={onClearSearch}
						className="text-[#63A361] hover:text-[#63A361] font-medium text-sm"
					>
						Clear search
					</button>
				)}
			</div>
		);
	}

	return (
		<div className="bg-white rounded-2xl p-8 text-center">
			<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
			<p className="text-gray-600 mb-2">
				{message || "No print stations found matching your search."}
			</p>
			{onClearSearch && (
				<button
					onClick={onClearSearch}
					className="text-[#63A361] hover:text-[#63A361] font-medium text-sm"
				>
					Clear search
				</button>
			)}
		</div>
	);
};


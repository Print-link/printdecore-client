import { Search, X } from "lucide-react";

interface SearchBarProps {
	searchQuery: string;
	onSearchChange: (query: string) => void;
	resultCount: number;
	placeholder?: string;
	resultLabel?: string;
}

export const SearchBar = ({
	searchQuery,
	onSearchChange,
	resultCount,
	placeholder = "Search by name, email, or location...",
	resultLabel = "print station",
}: SearchBarProps) => {
	const clearSearch = () => {
		onSearchChange("");
	};

	return (
		<div className="mb-6">
			<div className="relative">
				<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
					<Search className="h-5 w-5 text-gray-400" />
				</div>
				<input
					type="text"
					placeholder={placeholder}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent text-sm sm:text-base bg-white"
				/>
				{searchQuery && (
					<button
						onClick={clearSearch}
						className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
						aria-label="Clear search"
					>
						<X className="h-5 w-5" />
					</button>
				)}
			</div>
			{searchQuery && (
				<p className="mt-2 text-sm text-gray-600">
					{resultCount === 0
						? `No ${resultLabel}s found`
						: `Found ${resultCount} ${resultLabel}${
								resultCount !== 1 ? "s" : ""
						  }`}
				</p>
			)}
		</div>
	);
};


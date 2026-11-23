import { MagnifyingGlass, X } from "@phosphor-icons/react";

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
					<MagnifyingGlass size={20} weight="regular" className="text-ink-3" />
				</div>
				<input
					type="text"
					placeholder={placeholder}
					value={searchQuery}
					onChange={(e) => onSearchChange(e.target.value)}
					className="w-full pl-11 pr-10 py-3 border border-line-strong rounded-xl focus:border-ink text-base bg-fill"
				/>
				{searchQuery && (
					<button
						onClick={clearSearch}
						className="absolute inset-y-0 right-0 pr-4 flex items-center text-ink-3 hover:text-ink transition-colors"
						aria-label="Clear search"
					>
						<X size={20} weight="bold" />
					</button>
				)}
			</div>
			{searchQuery && (
				<p className="mt-2 text-sm text-ink-2">
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


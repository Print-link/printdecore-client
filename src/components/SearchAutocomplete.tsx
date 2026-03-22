import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Tag, Package, Layers } from "lucide-react";
import { getSearchSuggestions, type SearchSuggestions } from "../services/orderApi";

interface SearchAutocompleteProps {
	onSelect?: (type: "category" | "subCategory" | "service", id: string) => void;
	placeholder?: string;
	className?: string;
}

export const SearchAutocomplete = ({
	onSelect,
	placeholder = "Search categories, services…",
	className = "",
}: SearchAutocompleteProps) => {
	const [query, setQuery] = useState("");
	const [suggestions, setSuggestions] = useState<SearchSuggestions>({
		categories: [],
		subCategories: [],
		services: [],
	});
	const [loading, setLoading] = useState(false);
	const [showSuggestions, setShowSuggestions] = useState(false);
	const [selectedIndex, setSelectedIndex] = useState(-1);
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const fetchSuggestions = async () => {
			if (query.length < 2) {
				setSuggestions({ categories: [], subCategories: [], services: [] });
				setShowSuggestions(false);
				return;
			}
			setLoading(true);
			try {
				const response = await getSearchSuggestions(query);
				if (response.success && response.data) {
					setSuggestions(response.data);
					setShowSuggestions(true);
				}
			} catch (error) {
				console.error("Error fetching suggestions:", error);
			} finally {
				setLoading(false);
			}
		};

		const debounceTimer = setTimeout(fetchSuggestions, 300);
		return () => clearTimeout(debounceTimer);
	}, [query]);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node) &&
				inputRef.current &&
				!inputRef.current.contains(event.target as Node)
			) {
				setShowSuggestions(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (
		type: "category" | "subCategory" | "service",
		id: string,
		subCategoryId?: string,
		_branchId?: string,
		name?: string
	) => {
		setShowSuggestions(false);
		setQuery("");
		if (onSelect) {
			onSelect(type, id);
			return;
		}
		if (type === "category") {
			navigate(`/home/search?categoryId=${id}`);
		} else if (type === "subCategory") {
			navigate(`/home/search?subCategoryId=${subCategoryId || id}`);
		} else if (type === "service") {
			// Navigate to search page with service name so user can see branches & pick one
			navigate(`/home/search?query=${encodeURIComponent(name || id)}`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!showSuggestions) return;
		const allItems = [
			...suggestions.categories.map((c) => ({ type: "category" as const, id: c.id, name: c.name })),
			...suggestions.subCategories.map((s) => ({ type: "subCategory" as const, id: s.id, subCategoryId: s.categoryId, name: s.name })),
			...suggestions.services.map((s) => ({ type: "service" as const, id: s.id, subCategoryId: s.subCategoryId, name: s.name })),
		];
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev < allItems.length - 1 ? prev + 1 : prev));
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
		} else if (e.key === "Enter" && selectedIndex >= 0) {
			e.preventDefault();
			const item = allItems[selectedIndex];
			handleSelect(item.type, item.id, "subCategoryId" in item ? item.subCategoryId : undefined, undefined, item.name);
		} else if (e.key === "Escape") {
			setShowSuggestions(false);
		}
	};

	const hasSuggestions =
		suggestions.categories.length > 0 ||
		suggestions.subCategories.length > 0 ||
		suggestions.services.length > 0;

	return (
		<div className={`relative ${className}`}>
			{/* Input */}
			<div className="relative">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400 dark:text-gray-500 pointer-events-none" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
					onFocus={() => query.length >= 2 && setShowSuggestions(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="w-full pl-11 pr-11 py-3.5 bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-sm text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24] transition-all duration-200"
				/>
				{loading && (
					<Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 animate-spin" />
				)}
			</div>

			{/* Dropdown */}
			{showSuggestions && hasSuggestions && (
				<div
					ref={suggestionsRef}
					className="absolute z-50 w-full mt-2 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-700 rounded-2xl shadow-xl shadow-black/8 overflow-hidden max-h-80 overflow-y-auto"
				>
					{suggestions.categories.length > 0 && (
						<div>
							<p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
								Categories
							</p>
							{suggestions.categories.map((category, index) => (
								<button
									key={category.id}
									onClick={() => handleSelect("category", category.id)}
									className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
										selectedIndex === index ? "bg-gray-50 dark:bg-gray-800/60" : ""
									}`}
								>
									<div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
										<Tag className="w-3.5 h-3.5 text-[#fbbf24]" />
									</div>
									<span className="text-sm font-medium text-gray-800 dark:text-gray-200">{category.name}</span>
								</button>
							))}
						</div>
					)}

					{suggestions.subCategories.length > 0 && (
						<div className={suggestions.categories.length > 0 ? "border-t border-gray-50 dark:border-gray-800" : ""}>
							<p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
								Sub-categories
							</p>
							{suggestions.subCategories.map((subCategory, index) => {
								const itemIndex = suggestions.categories.length + index;
								return (
									<button
										key={subCategory.id}
										onClick={() => handleSelect("subCategory", subCategory.categoryId, subCategory.id)}
										className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
											selectedIndex === itemIndex ? "bg-gray-50 dark:bg-gray-800/60" : ""
										}`}
									>
										<div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
											<Layers className="w-3.5 h-3.5 text-[#fbbf24]" />
										</div>
										<div>
											<p className="text-sm font-medium text-gray-800 dark:text-gray-200">{subCategory.name}</p>
											<p className="text-xs text-gray-400 dark:text-gray-500">{subCategory.categoryName}</p>
										</div>
									</button>
								);
							})}
						</div>
					)}

					{suggestions.services.length > 0 && (
						<div className={(suggestions.categories.length > 0 || suggestions.subCategories.length > 0) ? "border-t border-gray-50 dark:border-gray-800" : ""}>
							<p className="px-4 pt-3 pb-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
								Services
							</p>
							{suggestions.services.map((service, index) => {
								const itemIndex = suggestions.categories.length + suggestions.subCategories.length + index;
								return (
									<button
										key={service.id}
										onClick={() => handleSelect("service", service.id, service.subCategoryId, undefined, service.name)}
										className={`w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
											selectedIndex === itemIndex ? "bg-gray-50 dark:bg-gray-800/60" : ""
										}`}
									>
										<div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center shrink-0">
											<Package className="w-3.5 h-3.5 text-[#fbbf24]" />
										</div>
										<div>
											<p className="text-sm font-medium text-gray-800 dark:text-gray-200">{service.name}</p>
											<p className="text-xs text-gray-400 dark:text-gray-500">{service.subCategoryName} · {service.categoryName}</p>
										</div>
									</button>
								);
							})}
						</div>
					)}

					<div className="h-2" />
				</div>
			)}
		</div>
	);
};

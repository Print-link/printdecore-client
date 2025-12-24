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
	placeholder = "Search categories, services...",
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
		branchId?: string
	) => {
		setShowSuggestions(false);
		setQuery("");

		if (onSelect) {
			onSelect(type, id);
			return;
		}

		// Default navigation behavior
		if (type === "category") {
			navigate(`/home/categories/${branchId || ""}?categoryId=${id}`);
		} else if (type === "subCategory") {
			navigate(`/home/order/sub-categories/${branchId || ""}?categoryId=${id}&subCategoryId=${subCategoryId}`);
		} else if (type === "service") {
			navigate(`/home/order/service-templates/${branchId || ""}?serviceTemplateId=${id}`);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (!showSuggestions) return;

		const allItems = [
			...suggestions.categories.map((c) => ({ type: "category" as const, id: c.id })),
			...suggestions.subCategories.map((s) => ({
				type: "subCategory" as const,
				id: s.id,
				subCategoryId: s.categoryId,
			})),
			...suggestions.services.map((s) => ({
				type: "service" as const,
				id: s.id,
				subCategoryId: s.subCategoryId,
			})),
		];

		if (e.key === "ArrowDown") {
			e.preventDefault();
			setSelectedIndex((prev) =>
				prev < allItems.length - 1 ? prev + 1 : prev
			);
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
		} else if (e.key === "Enter" && selectedIndex >= 0) {
			e.preventDefault();
			const item = allItems[selectedIndex];
			handleSelect(item.type, item.id, "subCategoryId" in item ? item.subCategoryId : undefined);
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
			<div className="relative">
				<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
				<input
					ref={inputRef}
					type="text"
					value={query}
					onChange={(e) => setQuery(e.target.value)}
					onFocus={() => query.length >= 2 && setShowSuggestions(true)}
					onKeyDown={handleKeyDown}
					placeholder={placeholder}
					className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
				/>
				{loading && (
					<Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
				)}
			</div>

			{showSuggestions && hasSuggestions && (
				<div
					ref={suggestionsRef}
					className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg max-h-96 overflow-y-auto"
				>
					{suggestions.categories.length > 0 && (
						<div className="p-2">
							<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
								Categories
							</div>
							{suggestions.categories.map((category, index) => {
								const itemIndex = index;
								return (
									<button
										key={category.id}
										onClick={() => handleSelect("category", category.id)}
										className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
											selectedIndex === itemIndex ? "bg-gray-100" : ""
										}`}
									>
										<Tag className="w-4 h-4 text-[#fbbf24]" />
										<span className="text-sm text-gray-900">{category.name}</span>
									</button>
								);
							})}
						</div>
					)}

					{suggestions.subCategories.length > 0 && (
						<div className="p-2 border-t border-gray-200">
							<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
								SubCategories
							</div>
							{suggestions.subCategories.map((subCategory, index) => {
								const itemIndex =
									suggestions.categories.length + index;
								return (
									<button
										key={subCategory.id}
										onClick={() =>
											handleSelect(
												"subCategory",
												subCategory.categoryId,
												subCategory.id
											)
										}
										className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
											selectedIndex === itemIndex ? "bg-gray-100" : ""
										}`}
									>
										<Layers className="w-4 h-4 text-[#fbbf24]" />
										<div className="flex-1 text-left">
											<span className="text-sm text-gray-900">
												{subCategory.name}
											</span>
											<div className="text-xs text-gray-500">
												{subCategory.categoryName}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					)}

					{suggestions.services.length > 0 && (
						<div className="p-2 border-t border-gray-200">
							<div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
								Services
							</div>
							{suggestions.services.map((service, index) => {
								const itemIndex =
									suggestions.categories.length +
									suggestions.subCategories.length +
									index;
								return (
									<button
										key={service.id}
										onClick={() =>
											handleSelect("service", service.id, service.subCategoryId)
										}
										className={`w-full flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-100 transition-colors ${
											selectedIndex === itemIndex ? "bg-gray-100" : ""
										}`}
									>
										<Package className="w-4 h-4 text-[#fbbf24]" />
										<div className="flex-1 text-left">
											<span className="text-sm text-gray-900">
												{service.name}
											</span>
											<div className="text-xs text-gray-500">
												{service.subCategoryName} • {service.categoryName}
											</div>
										</div>
									</button>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
};


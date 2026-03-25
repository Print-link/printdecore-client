import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	SpinnerGap,
	WarningCircle,
	ArrowLeft,
	Tag,
	MagnifyingGlass,
	CaretRight,
} from "@phosphor-icons/react";
import { getSubCategories, type SubCategory } from "../services/orderApi";
import { EmptyState } from "../components/EmptyState";

type PricingType = "AREA_BASED" | "UNIT_BASED" | "MIXED" | "CUSTOM_QUOTE";

export const SubCategories = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const [searchParams] = useSearchParams();
	const categoryId = searchParams.get("categoryId");
	const navigate = useNavigate();

	const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [selectedPricingType] = useState<PricingType | "ALL">("ALL");

	useEffect(() => {
		const fetchSubCategories = async () => {
			if (!categoryId) {
				setError("Category ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getSubCategories(categoryId);

				if (response.success && response.data) {
					setSubCategories(response.data);
				} else {
					setError("Failed to load subcategories");
				}
			} catch (err: unknown) {
				console.error("Error fetching subcategories:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load subcategories";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchSubCategories();
	}, [categoryId]);

	const handleSubCategoryClick = (subCategoryId: string) => {
		navigate(`/home/order/configure/${branchId}?subCategoryId=${subCategoryId}`);
	};

	const handleBack = () => {
		navigate(-1);
	};

	const filteredSubCategories = subCategories.filter((subCat) => {
		const matchesSearch =
			searchQuery === "" ||
			subCat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			subCat.description?.toLowerCase().includes(searchQuery.toLowerCase());

		const matchesPricingType =
			selectedPricingType === "ALL" || subCat.pricingType === selectedPricingType;

		return matchesSearch && matchesPricingType;
	});

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<SpinnerGap size={32} className="text-[#fbbf24] animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl p-8">
				<div className="text-center py-12">
					<WarningCircle size={48} className="text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
						Error Loading SubCategories
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#fbbf24] hover:text-[#fbbf24]"
					>
						<ArrowLeft size={16} className="mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Breadcrumb Navigation */}
			<nav className="flex items-center gap-1.5 text-sm mb-4">
				<button
					onClick={handleBack}
					className="text-gray-500 dark:text-gray-400 hover:text-[#fbbf24] transition-colors font-medium"
				>
					Categories
				</button>
				<CaretRight size={12} weight="bold" className="text-gray-300 dark:text-gray-600" />
				<span className="text-gray-900 dark:text-white font-semibold">
					Subcategories
				</span>
			</nav>

			{/* Header */}
			<div className="mb-4">
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
					Select a Subcategory
				</h1>
				<p className="text-sm text-gray-500 dark:text-gray-400">
					{subCategories.length} {subCategories.length === 1 ? "subcategory" : "subcategories"} available
				</p>
			</div>

			{/* Search - only show if more than 4 items */}
			{subCategories.length > 4 && (
				<div className="mb-4">
					<div className="relative">
						<MagnifyingGlass
							size={18}
							className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500"
						/>
						<input
							type="text"
							placeholder="Search subcategories..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-10 pr-4 py-3 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-800 rounded-2xl focus:border-[#fbbf24] focus:outline-none transition-colors text-sm"
						/>
					</div>
				</div>
			)}

			{/* SubCategories List */}
			{subCategories.length === 0 ? (
				<EmptyState type="no-results" />
			) : filteredSubCategories.length === 0 ? (
				<EmptyState type="no-results" onClearSearch={() => setSearchQuery("")} />
			) : (
				<div className="space-y-2">
					{filteredSubCategories.map((subCategory) => (
						<button
							key={subCategory.id}
							onClick={() => handleSubCategoryClick(subCategory.id)}
							className="w-full group bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/5 hover:border-gray-200 active:scale-[0.995]"
						>
							<div className="flex items-center gap-4">
								{subCategory.imageUrl ? (
									<img
										src={subCategory.imageUrl}
										alt={subCategory.name}
										className="w-12 h-12 object-cover rounded-xl shrink-0"
									/>
								) : (
									<div className="w-12 h-12 bg-linear-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl flex items-center justify-center shrink-0">
										<Tag size={22} weight="duotone" className="text-[#fbbf24]" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
										{subCategory.name}
									</h3>
									{subCategory.description && (
										<p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
											{subCategory.description}
										</p>
									)}
								</div>
								<CaretRight
									size={16}
									weight="bold"
									className="text-gray-300 dark:text-gray-600 group-hover:text-[#fbbf24] group-hover:translate-x-0.5 transition-all duration-300 shrink-0"
								/>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

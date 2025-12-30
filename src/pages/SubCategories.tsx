import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Tag, Search } from "lucide-react";
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
	const [selectedPricingType, _] = useState<PricingType | "ALL">("ALL");

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
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Error Loading SubCategories
					</h2>
					<p className="text-gray-600 mb-4">{error}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#fbbf24] hover:text-[#fbbf24]"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Header */}
			<div className="mb-4">
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Select a SubCategory
				</h1>
				<p className="text-sm text-gray-600">
					Choose a subcategory to view available services
				</p>
			</div>

			{/* Filters */}
			<div className="mb-4 space-y-3">
				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search subcategories..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-[#fbbf24] focus:outline-none transition-colors"
					/>
				</div>
			</div>

			{/* SubCategories List/Grid */}
			{subCategories.length === 0 ? (
				<EmptyState type="no-results" />
			) : filteredSubCategories.length === 0 ? (
				<EmptyState type="no-results" onClearSearch={() => setSearchQuery("")} />
			) : (
				<div className="space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-4 md:space-y-0">
					{filteredSubCategories.map((subCategory, index) => (
						<button
							key={subCategory.id}
							onClick={() => handleSubCategoryClick(subCategory.id)}
							className={`w-full bg-white p-4 border-2 border-gray-200 text-left group hover:border-[#fbbf24] transition-all ${
								index === 0
									? "rounded-t-lg md:rounded-lg"
									: index === filteredSubCategories.length - 1
									? "rounded-b-lg border-t-0 md:rounded-lg md:border-t-2"
									: "border-t-0 md:rounded-lg md:border-t-2"
							}`}
						>
							<div className="flex items-start gap-3 md:flex-col md:gap-4">
								<div className="flex items-center gap-3 flex-1 min-w-0 md:flex-col md:items-start md:w-full">
									{subCategory.imageUrl ? (
										<img className="w-24 h-24" src={subCategory.imageUrl} alt={subCategory.name} />
									) : (
										<div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-200 group-hover:border-[#fbbf24] transition-colors">
											<Tag className="w-6 h-6 text-[#fbbf24]" />
										</div>
									)}
									<div className="flex-1 min-w-0 md:w-full">
										<div className="flex items-start justify-between gap-2 mb-2">
											<h3 className="text-base md:text-lg font-bold text-gray-900 group-hover:text-[#fbbf24] transition-colors">
												{subCategory.name}
											</h3>
											{/* <span
												className={`px-2 py-1 rounded text-xs font-semibold shrink-0 ${getPricingTypeBadgeColor(
													subCategory.pricingType as PricingType
												)}`}
											>
												{subCategory.pricingType.replace("_", " ")}
											</span> */}
										</div>
										{subCategory.description && (
											<p className="text-sm text-gray-600 line-clamp-2 mb-2">
												{subCategory.description}
											</p>
										)}
										<div className="flex items-center text-sm font-semibold text-[#fbbf24]">
											<span>View Services</span>
											<span className="ml-2 hidden md:inline">→</span>
										</div>
									</div>
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};


import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Tag } from "lucide-react";
import { getCategories, type Category } from "../services/orderApi";
import { Reviews } from "../components/Reviews";

export const Categories = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchCategories = async () => {
			if (!id) {
				setError("Print station ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getCategories();

				if (response.success && response.data) {
					setCategories(response.data);
				} else {
					setError("Failed to load categories");
				}
			} catch (err: unknown) {
				console.error("Error fetching categories:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load categories";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchCategories();
	}, [id]);

	const handleCategoryClick = (categoryId: string) => {
		navigate(`/order/sub-categories/${id}?categoryId=${categoryId}`);
	};

	const handleBack = () => {
		navigate(-1);
	};

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
						Error Loading Categories
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
					Select a Category
				</h1>
				<p className="text-sm text-gray-600">
					Choose a print category to continue with your order
				</p>
			</div>

			{/* Main Content: Categories on left, Reviews on right (desktop) */}
			<div className="flex flex-col lg:flex-row gap-4">
				{/* Categories Section */}
				<div className="flex-1">
					{categories.length === 0 ? (
						<div className="bg-white rounded-2xl p-8 text-center">
							<Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
							<p className="text-gray-600">
								No categories available for this print station.
							</p>
						</div>
					) : (
						<div className="space-y-0 md:grid md:grid-cols-2 md:gap-4 md:space-y-0">
							{categories.map((category, index) => (
								<button
									key={category.id}
									onClick={() => handleCategoryClick(category.id)}
									className={`w-full bg-white p-4 border-2 border-gray-200 text-left group hover:border-[#fbbf24] transition-all flex items-center gap-3 md:flex-col md:items-start ${
										index === 0
											? "rounded-t-lg md:rounded-lg"
											: index === categories.length - 1
											? "rounded-b-lg border-t-0 md:rounded-lg md:border-t-2"
											: "border-t-0 md:rounded-lg md:border-t-2"
									}`}
								>
									{category.imageUrl ? (
										<img
											src={category.imageUrl}
											alt={category.name}
											className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-lg shrink-0"
										/>
									) : (
										<div className="w-16 h-16 md:w-20 md:h-20 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-200 group-hover:border-[#fbbf24] transition-colors">
											<Tag className="w-8 h-8 md:w-10 md:h-10 text-[#fbbf24]" />
										</div>
									)}
									<div className="flex-1 min-w-0">
										<h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 group-hover:text-[#fbbf24] transition-colors">
											{category.name}
										</h3>
										{category.description && (
											<p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-3 mb-2">
												{category.description}
											</p>
										)}
										<div className="flex items-center text-sm font-semibold text-[#fbbf24]">
											<span>View SubCategories</span>
											<span className="ml-2 hidden md:inline">→</span>
										</div>
									</div>
								</button>
							))}
						</div>
					)}
				</div>

				{/* Reviews Section - Desktop sidebar, Mobile bottom sheet */}
				{id && <Reviews adminId={id} />}
			</div>
		</div>
	);
};


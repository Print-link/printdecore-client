import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, ArrowLeft, Tag } from "lucide-react";
import { bussinessCategoryService } from "../services/bussinessCategoryService";
import type { Category } from "../types/category";

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
				const response = await bussinessCategoryService.getAllBussinessCategories(id);
				
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
		navigate(`/print-station/${id}?category=${categoryId}`);
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Error Loading Categories
					</h2>
					<p className="text-gray-600 mb-4">{error}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Header */}
			<div className="mb-6">
				<h1 className="text-xl md:text-xl font-bold text-gray-900 mb-2">
					Select a Category
				</h1>
				<p className="text-sm md:text-base text-gray-600">
					Choose a print category to continue with your order
				</p>
			</div>

			{/* Categories List */}
			{categories.length === 0 ? (
				<div className="bg-white rounded-2xl p-8 text-center">
					<Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-600">No categories available for this print station.</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
					{categories.map((category) => (
						<button
							key={category._id || category.id}
							onClick={() => handleCategoryClick(category._id || category.id)}
							className="bg-white rounded-xl p-3 border border-gray-300 text-left group"
						>
							<div className="flex gap-3 items-center mb-4">
							<div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
									<Tag className="w-6 h-6 text-indigo-700" />
								</div>
							<h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors">
								{category.name}
							</h3>
							</div>
							{category.description && (
								<p className="text-sm text-gray-600 mb-3 line-clamp-2">
									{category.description}
								</p>
							)}
							<div className="flex items-center justify-between pt-3 border-t border-gray-200">
								<span className="text-sm font-medium text-gray-600">Price:</span>
								<span className="text-xl font-bold text-indigo-600">
									GHS{category.unitPrice.toFixed(2)}
								</span>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};


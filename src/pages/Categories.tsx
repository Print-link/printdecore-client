import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { SpinnerGap, WarningCircle, ArrowLeft, Tag, CaretRight } from "@phosphor-icons/react";
import { getCategories, type Category } from "../services/orderApi";
import { Reviews } from "../components/Reviews";
import { useAuth } from "../hooks/useAuth";
import { AuthPrompt } from "../components/AuthPrompt";

export const Categories = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [categories, setCategories] = useState<Category[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [showAuthPrompt, setShowAuthPrompt] = useState(false);

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
		if (!user) {
			setShowAuthPrompt(true);
			return;
		}
		navigate(`/home/order/sub-categories/${id}?categoryId=${categoryId}`);
	};

	const handleAuthPromptClose = () => {
		setShowAuthPrompt(false);
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<SpinnerGap size={32} weight="bold" className="text-[#fbbf24] animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white dark:bg-[#1e1e1e] rounded-2xl p-8">
				<div className="text-center py-12">
					<WarningCircle size={48} weight="duotone" className="text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
						Error Loading Categories
					</h2>
					<p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#fbbf24] hover:text-[#fbbf24]"
					>
						<ArrowLeft size={16} weight="bold" className="mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

return (
		<>
			<div className="w-full max-w-7xl mx-auto">
				{/* Breadcrumb Navigation */}
				<nav className="mb-4 flex items-center gap-1.5 text-sm">
					<button
						onClick={handleBack}
						className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors font-medium"
					>
						Print Station
					</button>
					<CaretRight size={12} weight="bold" className="text-gray-300 dark:text-gray-600" />
					<span className="text-gray-900 dark:text-white font-semibold">Categories</span>
				</nav>

				{/* Header */}
				<div className="mb-4">
					<h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
						Select a Category
					</h1>
					<p className="text-sm text-gray-500 dark:text-gray-400">
						{categories.length} {categories.length === 1 ? "category" : "categories"} available
					</p>
				</div>

			{/* Main Content: Categories on left, Reviews on right (desktop) */}
			<div className="flex flex-col lg:flex-row gap-4">
				{/* Categories Section */}
				<div className="flex-1">
					{categories.length === 0 ? (
						<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-8 text-center">
							<Tag size={48} weight="duotone" className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
							<p className="text-gray-600 dark:text-gray-400">
								No categories available for this print station.
							</p>
						</div>
					) : (
						<div className="space-y-2">
							{categories.map((category) => (
								<button
									key={category.id}
									onClick={() => handleCategoryClick(category.id)}
									className="w-full group bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left transition-all duration-200 hover:shadow-lg hover:shadow-gray-900/5 hover:border-gray-200 active:scale-[0.995]"
								>
									<div className="flex items-center gap-4">
										{category.imageUrl ? (
											<img
												src={category.imageUrl}
												alt={category.name}
												className="w-12 h-12 object-cover rounded-xl shrink-0"
											/>
										) : (
											<div className="w-12 h-12 bg-gray-50 dark:bg-[#161616] rounded-xl flex items-center justify-center shrink-0">
												<Tag size={24} weight="duotone" className="text-[#fbbf24]" />
											</div>
										)}
										<div className="flex-1 min-w-0">
											<h3 className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">
												{category.name}
											</h3>
											{category.description && (
												<p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
													{category.description}
												</p>
											)}
										</div>
										<CaretRight size={16} weight="bold" className="text-gray-300 dark:text-gray-600 group-hover:text-[#fbbf24] group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
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

			{/* Authentication Prompt */}
			<AuthPrompt
				isOpen={showAuthPrompt}
				onClose={handleAuthPromptClose}
				message="Sign in to place orders and access printing services"
				title="Sign In Required"
			/>
		</>
	);
};

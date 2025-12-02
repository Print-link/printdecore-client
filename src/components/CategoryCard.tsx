import { Tag, MapPin, Navigation } from "lucide-react";
import type { SearchCategory } from "../types/category";
import { getDistanceColor, formatDistance } from "../utils/stationUtils";

interface CategoryCardProps {
	category: SearchCategory;
	onCategoryClick: (categoryId: string, adminId: string) => void;
}

export const CategoryCard = ({
	category,
	onCategoryClick,
}: CategoryCardProps) => {
	const categoryId = category._id || category.id || "";
	const adminId = category.admin._id;

	const handleClick = () => {
		onCategoryClick(categoryId, adminId);
	};

	return (
		<div className="bg-white rounded-xl border border-gray-300 group hover:shadow-lg transition-all overflow-hidden">
			{/* Mobile: List layout, Desktop: Card layout */}
			<div className="flex flex-row md:flex-col">
				{/* Image Section - Left on mobile, top on desktop */}
				<div className="shrink-0 md:w-full">
					{category.admin.businessCoverImage ? (
						<img
							className="w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 object-cover"
							src={category.admin.businessCoverImage}
							alt={category.admin.businessName || category.name}
						/>
					) : (
						<div className="w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 bg-indigo-100 flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
							<Tag className="w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 text-indigo-700" />
						</div>
					)}
				</div>

				{/* Content Section - Right on mobile, bottom on desktop */}
				<div className="flex-1 flex flex-col min-w-0 p-3 md:p-6">
					<button
						onClick={handleClick}
						className="w-full text-left touch-manipulation flex-1"
					>
						{/* Category Name */}
						<h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2 group-hover:text-indigo-700 transition-colors line-clamp-1">
							{category.name}
						</h3>

						{/* Business Name */}
						{category.admin.businessName && (
							<p className="text-xs md:text-sm text-gray-600 mb-1.5 md:mb-2 line-clamp-1">
								{category.admin.businessName}
							</p>
						)}

						{/* Compact Info - Mobile optimized */}
						<div className="space-y-1 md:space-y-2">
							{category.admin.location?.address && (
								<div className="flex items-start text-xs md:text-sm text-gray-600">
									<MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-400 mt-0.5 shrink-0" />
									<span className="line-clamp-1 md:line-clamp-2">
										{category.admin.location.address}
									</span>
								</div>
							)}
							{category.distance !== undefined && (
								<div
									className={`flex items-center text-xs md:text-sm font-medium ${getDistanceColor(
										category.distance
									)}`}
								>
									<Navigation className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
									<span>{formatDistance(category.distance)}</span>
								</div>
							)}
							{category.description && (
								<p className="text-xs md:text-sm text-gray-600 line-clamp-2 mt-1">
									{category.description}
								</p>
							)}
						</div>

						{/* Price */}
						<div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm font-medium text-gray-600">Price:</span>
								<span className="text-base md:text-lg font-bold text-indigo-600">
									GHS {category.unitPrice.toFixed(2)}
								</span>
							</div>
						</div>
					</button>

					{/* Action Buttons */}
					{/* {onGetDirections && category.admin.location?.latitude && category.admin.location?.longitude && (
						<div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
							<button
								onClick={(e) => onGetDirections(e, category)}
								className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation border border-gray-200"
								title="Get directions on Google Maps"
							>
								<MapPin className="w-3 h-3 md:w-4 md:h-4" />
								<span>Directions</span>
								<ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
							</button>
						</div>
					)} */}
				</div>
			</div>
		</div>
	);
};


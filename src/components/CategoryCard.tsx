import { Tag, MapPin, Navigation, Star } from "lucide-react";
import type { SearchCategory } from "../types/category";
import { getDistanceColor, formatDistance } from "../utils/stationUtils";
import { isStationOpen } from "../utils/workingHours";
import { StationStatusBadge } from "./StationStatusBadge";

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
	const openStatus =
		category.admin.isOpen !== undefined
			? category.admin.isOpen
			: isStationOpen(category.admin.workingHours);
	const isOpen = openStatus === true;
	const isClickable = openStatus === true;

	const handleClick = () => {
		if (isClickable) {
			onCategoryClick(categoryId, adminId);
		}
	};

	return (
		<div
			className={`relative bg-white rounded-xl border transition-all overflow-hidden ${
				isClickable
					? "border-gray-300 group hover:shadow-lg cursor-pointer"
					: "border-gray-200 opacity-75 cursor-not-allowed"
			}`}
		>
			{!isClickable && (
				<div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 rounded-xl" />
			)}

			<div className="flex flex-row md:flex-col">
				<div className="relative shrink-0 md:w-full">
					{category.admin.businessCoverImage ? (
						<img
							className="w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 object-cover"
							src={category.admin.businessCoverImage}
							alt={category.admin.businessName || category.name}
						/>
					) : (
						<div
							className={`w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 bg-indigo-100 flex items-center justify-center transition-colors ${
								isOpen ? "group-hover:bg-indigo-200" : ""
							}`}
						>
							<Tag className="w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 text-indigo-700" />
						</div>
					)}
					<div className="absolute top-2 right-2 z-20">
						<StationStatusBadge
							workingHours={category.admin.workingHours}
							isOpen={category.admin.isOpen}
							compact={true}
						/>
					</div>
				</div>

				<div className="flex-1 flex flex-col min-w-0 p-3 md:p-6">
					<button
						onClick={handleClick}
						disabled={!isClickable}
						className={`w-full text-left touch-manipulation flex-1 ${
							!isClickable ? "cursor-not-allowed" : ""
						}`}
					>
						<div className="flex items-center justify-between mb-1.5 md:mb-2">
							<h3
								className={`text-base md:text-lg font-bold line-clamp-1 transition-colors flex-1 ${
									isClickable
										? "text-gray-900 group-hover:text-indigo-700"
										: "text-gray-500"
								}`}
							>
								{category.name}
							</h3>
							{category.admin.averageRating !== undefined && category.admin.averageRating > 0 && (
								<div className="flex items-center gap-1 shrink-0 ml-2">
									<Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
									<span className="text-sm font-semibold text-gray-700">
										{category.admin.averageRating.toFixed(1)}
									</span>
								</div>
							)}
						</div>

						{category.admin.businessName && (
							<p className="text-xs md:text-sm text-gray-600 mb-1.5 md:mb-2 line-clamp-1">
								{category.admin.businessName}
							</p>
						)}

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
							<div className="pt-1 md:pt-2">
								<StationStatusBadge
									workingHours={category.admin.workingHours}
									isOpen={category.admin.isOpen}
									compact={false}
								/>
							</div>
						</div>

						<div className="mt-2 md:mt-3 pt-2 md:pt-3 border-t border-gray-200">
							<div className="flex items-center justify-between">
								<span className="text-xs md:text-sm font-medium text-gray-600">
									Price:
								</span>
								<span className="text-base md:text-lg font-bold text-indigo-600">
									GHS {category.unitPrice.toFixed(2)}
								</span>
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};


import { MapPin, ArrowSquareOut } from "@phosphor-icons/react";
import type { Category } from "../types/category";
import type { PrintStation } from "../types/printStation";
import { RatingDisplay } from "./ratings/RatingDisplay";

interface PrintStationHeaderProps {
	printStation: PrintStation;
	selectedCategory: Category | null;
	onGetDirections: () => void;
}

export const PrintStationHeader = ({
	printStation,
	selectedCategory,
	onGetDirections,
}: PrintStationHeaderProps) => {
	return (
		<div className="mb-6 sm:mb-8 p-4 bg-slate-50 dark:bg-[#161616] rounded-xl border border-slate-100 dark:border-gray-800">
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<div className="flex items-center gap-3 mb-2">
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
							{printStation.name}
						</h2>
						{printStation.averageRating !== undefined &&
							printStation.averageRating > 0 && (
								<RatingDisplay
									rating={printStation.averageRating}
									totalRatings={printStation.totalRatings}
									size="sm"
								/>
							)}
					</div>
					<p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
						<span className="font-medium">Email:</span> {printStation.email}
					</p>
				</div>
				{printStation.location?.latitude &&
					printStation.location?.longitude && (
						<button
							onClick={onGetDirections}
							className="ml-4 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors border border-gray-300 dark:border-gray-600 whitespace-nowrap"
							title="Get directions on Google Maps"
						>
							<MapPin size={16} weight="regular" />
							<span className="sm:inline">Directions</span>
							<ArrowSquareOut size={12} weight="regular" />
						</button>
					)}
			</div>
			{selectedCategory && (
				<div className="mt-3 p-3 bg-white dark:bg-[#1e1e1e] rounded-lg border border-[white] dark:border-gray-700">
					<p className="text-sm font-medium text-[#fbbf24] mb-1">
						Selected Category: {selectedCategory.name}
					</p>
					<p className="text-xs text-[#fbbf24]">
						Price: GHS{selectedCategory.unitPrice.toFixed(2)} per unit
					</p>
				</div>
			)}
			{printStation.location?.address && (
				<p className="text-sm text-gray-600 dark:text-gray-400">
					<span className="font-medium">Location:</span>{" "}
					{printStation.location.address}
				</p>
			)}
		</div>
	);
};


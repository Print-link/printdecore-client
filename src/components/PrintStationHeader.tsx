import { MapPin, ExternalLink } from "lucide-react";
import type { Category } from "../types/category";
import type { PrintStation } from "../types/printStation";

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
		<div className="mb-6 sm:mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
						{printStation.name}
					</h2>
					<p className="text-sm text-gray-600 mb-1">
						<span className="font-medium">Email:</span> {printStation.email}
					</p>
				</div>
				{printStation.location?.latitude &&
					printStation.location?.longitude && (
						<button
							onClick={onGetDirections}
							className="ml-4 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 whitespace-nowrap"
							title="Get directions on Google Maps"
						>
							<MapPin className="w-4 h-4" />
							<span className="sm:inline">Directions</span>
							<ExternalLink className="w-3 h-3" />
						</button>
					)}
			</div>
			{selectedCategory && (
				<div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
					<p className="text-sm font-medium text-indigo-900 mb-1">
						Selected Category: {selectedCategory.name}
					</p>
					<p className="text-xs text-indigo-700">
						Price: GHS{selectedCategory.unitPrice.toFixed(2)} per unit
					</p>
				</div>
			)}
			{printStation.location?.address && (
				<p className="text-sm text-gray-600">
					<span className="font-medium">Location:</span>{" "}
					{printStation.location.address}
				</p>
			)}
		</div>
	);
};


import { Printer, MapPin, Mail, Navigation, ExternalLink } from "lucide-react";
import type { PrintStation } from "../types/printStation";
import { getDistanceColor, formatDistance } from "../utils/stationUtils";

interface PrintStationCardProps {
	station: PrintStation;
	onStationClick: (stationId: string) => void;
	onGetDirections: (e: React.MouseEvent, station: PrintStation) => void;
}

export const PrintStationCard = ({
	station,
	onStationClick,
	onGetDirections,
}: PrintStationCardProps) => {
	const stationId = station._id || station.id || "";

	return (
		<div className="bg-white rounded-xl border border-gray-300 group hover:shadow-lg transition-all overflow-hidden">
			{/* Mobile: List layout, Desktop: Card layout */}
			<div className="flex flex-row md:flex-col">
				{/* Image Section - Left on mobile, top on desktop */}
				<div className="shrink-0 md:w-full">
					{station.businessCoverImage ? (
						<img
							className="w-24 h-24 md:w-full md:h-48 object-cover"
							src={station.businessCoverImage}
							alt={station.businessName || station.name}
						/>
					) : (
						<div className="w-24 h-24 md:w-full md:h-48 bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-colors">
							<Printer className="w-8 h-8 md:w-12 md:h-12 text-slate-700" />
						</div>
					)}
				</div>

				{/* Content Section - Right on mobile, bottom on desktop */}
				<div className="flex-1 flex flex-col min-w-0 p-3 md:p-6">
					<button
						onClick={() => onStationClick(stationId)}
						className="w-full text-left touch-manipulation flex-1"
					>
						{/* Business Name */}
						<h3 className="text-base md:text-lg font-bold text-gray-900 mb-1.5 md:mb-2 group-hover:text-slate-700 transition-colors line-clamp-1">
							{station?.businessName || station.name}
						</h3>

						{/* Compact Info - Mobile optimized */}
						<div className="space-y-1 md:space-y-2">
							{station.location?.address && (
								<div className="flex items-start text-xs md:text-sm text-gray-600">
									<MapPin className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-400 mt-0.5 shrink-0" />
									<span className="line-clamp-1 md:line-clamp-2">
										{station.location.address}
									</span>
								</div>
							)}
							{station.distance !== undefined && (
								<div
									className={`flex items-center text-xs md:text-sm font-medium ${getDistanceColor(
										station.distance
									)}`}
								>
									<Navigation className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
									<span>{formatDistance(station.distance)}</span>
								</div>
							)}
							{station.email && (
								<div className="flex items-center text-xs md:text-sm text-gray-600">
									<Mail className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-gray-400 shrink-0" />
									<span className="truncate">{station.email}</span>
								</div>
							)}
						</div>
					</button>

					{/* Action Buttons */}
					<div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-gray-200">
						<div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
							{/* <button
								onClick={() => onStationClick(stationId)}
								className="w-full md:flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs md:text-sm rounded-lg transition-all touch-manipulation py-2.5 text-center shadow-sm hover:shadow-md"
							>
								Submit Print Job →
							</button> */}
							{station.location?.latitude && station.location?.longitude && (
								<button
									onClick={(e) => onGetDirections(e, station)}
									className="w-full md:w-auto flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs md:text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation border border-gray-200 whitespace-nowrap"
									title="Get directions on Google Maps"
								>
									<MapPin className="w-3 h-3 md:w-4 md:h-4" />
									<span>Directions</span>
									<ExternalLink className="w-2.5 h-2.5 md:w-3 md:h-3" />
								</button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};


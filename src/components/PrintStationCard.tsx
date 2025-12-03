import { Printer, MapPin, Mail, Navigation } from "lucide-react";
import type { PrintStation } from "../types/printStation";
import { getDistanceColor, formatDistance } from "../utils/stationUtils";
import { isStationOpen } from "../utils/workingHours";
import { StationStatusBadge } from "./StationStatusBadge";

interface PrintStationCardProps {
	station: PrintStation;
	onStationClick: (stationId: string) => void;
}

export const PrintStationCard = ({
	station,
	onStationClick,
}: PrintStationCardProps) => {
	const stationId = station._id || station.id || "";
	// Use backend's isOpen if available, otherwise calculate client-side
	const openStatus = station.isOpen !== undefined 
		? station.isOpen 
		: isStationOpen(station.workingHours);
	const isOpen = openStatus === true;
	const isClickable = openStatus === true;

	const handleClick = () => {
		if (isClickable) {
			onStationClick(stationId);
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
					{station.businessCoverImage ? (
						<img
							className="w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 object-cover"
							src={station.businessCoverImage}
							alt={station.businessName || station.name}
						/>
					) : (
						<div
							className={`w-32 h-32 sm:w-36 sm:h-36 md:w-full md:h-48 bg-slate-100 flex items-center justify-center transition-colors ${
								isOpen ? "group-hover:bg-slate-200" : ""
							}`}
						>
							<Printer className="w-10 h-10 sm:w-12 sm:h-12 md:w-12 md:h-12 text-slate-700" />
						</div>
					)}
					<div className="absolute top-2 right-2 z-20">
						<StationStatusBadge
							workingHours={station.workingHours}
							isOpen={station.isOpen}
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
						<h3
							className={`text-base md:text-lg font-bold mb-1.5 md:mb-2 line-clamp-1 transition-colors ${
								isClickable
									? "text-gray-900 group-hover:text-slate-700"
									: "text-gray-500"
							}`}
						>
							{station?.businessName || station.name}
						</h3>

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
							<div className="pt-1 md:pt-2">
								<StationStatusBadge
									workingHours={station.workingHours}
									isOpen={station.isOpen}
									compact={false}
								/>
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};


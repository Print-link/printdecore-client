import { Printer, MapPin, Star, Navigation } from "lucide-react";
import type { PrintStation } from "../types/printStation";
import { formatDistance } from "../utils/stationUtils";
import { isStationOpen } from "../utils/workingHours";
import { StationStatusBadge } from "./StationStatusBadge";

interface PrintStationCardHorizontalProps {
  station: PrintStation;
  onStationClick: (stationId: string) => void;
}

export const PrintStationCardHorizontal = ({
  station,
  onStationClick,
}: PrintStationCardHorizontalProps) => {
  const stationId = station._id || station.id || "";
  const openStatus =
    station.isOpen !== undefined
      ? station.isOpen
      : isStationOpen(station.workingHours);
  const isClickable = openStatus === true;

  const handleClick = () => {
    if (isClickable) onStationClick(stationId);
  };

  return (
    <div
      className={`relative bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden min-w-[200px] max-w-[200px] sm:min-w-[230px] sm:max-w-[230px] transition-all duration-200 ${
        isClickable
          ? "cursor-pointer hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 shadow-sm shadow-black/5 border border-gray-100 dark:border-gray-800 hover:border-[#fbbf24]/40"
          : "opacity-60 cursor-not-allowed border border-gray-100 dark:border-gray-800 shadow-sm"
      }`}
      onClick={handleClick}
    >
      {!isClickable && (
        <div className="absolute inset-0 bg-white/50 dark:bg-black/30 backdrop-blur-[1px] z-10 rounded-2xl" />
      )}

      {/* Image */}
      <div className="relative overflow-hidden">
        {station.businessCoverImage ? (
          <img
            className="w-full h-36 object-cover transition-transform duration-300 group-hover:scale-105"
            src={station.businessCoverImage}
            alt={station.businessName || station.name}
          />
        ) : (
          <div className="w-full h-36 bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Printer className="w-10 h-10 text-[#fbbf24]" />
          </div>
        )}
        {/* Status badge */}
        <div className="absolute top-2.5 right-2.5 z-20">
          <StationStatusBadge
            workingHours={station.workingHours}
            isOpen={station.isOpen}
            compact={true}
          />
        </div>
        {/* Gradient overlay */}
        <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3.5">
        <h3 className="font-black text-gray-900 dark:text-white text-sm leading-tight line-clamp-1 mb-2">
          {station?.businessName || station.name}
        </h3>

        <div className="flex items-center gap-3 mb-2">
          {station.averageRating !== undefined && station.averageRating > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-900/20 rounded-full px-2 py-0.5">
              <Star className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {station.averageRating.toFixed(1)}
              </span>
            </div>
          )}

          {station.distance !== undefined && (
            <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
              <Navigation className="w-3 h-3" />
              <span className="text-xs font-medium">{formatDistance(station.distance)}</span>
            </div>
          )}
        </div>

        {station.location?.address && (
          <div className="flex items-start gap-1 text-gray-400 dark:text-gray-500">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="text-xs line-clamp-1">{station.location.address}</span>
          </div>
        )}
      </div>
    </div>
  );
};

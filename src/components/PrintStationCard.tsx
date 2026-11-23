import { Printer, MapPin, Compass, Star, Package, Tag } from "@phosphor-icons/react";
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
	const openStatus =
		station.isOpen !== undefined
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
			className={`relative bg-surface rounded-lg border-2 transition-all overflow-hidden ${
				isClickable
					? "border-line group cursor-pointer hover:border-brand"
					: "border-line opacity-75 cursor-not-allowed"
			}`}
		>
			{!isClickable && (
				<div className="absolute inset-0 bg-white/60 dark:bg-black/30 z-10 rounded-xl" />
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
							<Printer size={48} weight="regular" className="text-brand-ink" />
						</div>
					)}
					<div className="absolute top-2 right-2 z-20">
						<StationStatusBadge
							workingHours={station.workingHours}
							isOpen={station.isOpen}
							compact={true}
						/>
					</div>
					{station.activeDiscount && (
						<div className="absolute top-2 left-2 z-20">
							<div className="flex items-center gap-1 bg-bad text-white text-xs font-bold px-2 py-1 rounded-full">
								<Tag size={10} weight="fill" />
								{station.activeDiscount.discountType === 'percentage'
									? `${station.activeDiscount.discountValue}% OFF`
									: `${station.activeDiscount.currency || 'GHS'} ${station.activeDiscount.discountValue} OFF`}
							</div>
						</div>
					)}
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
										? "text-ink group-hover:text-brand-ink"
										: "text-ink-2"
								}`}
							>
								{station?.businessName || station.name}
							</h3>
							<div className="flex items-center gap-1.5 shrink-0 ml-2">
								{station.performanceTier && (
									<span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none ${
										station.performanceTier === 'diamond'
											? '   text-white'
											: 'bg-brand-tint text-brand-ink'
									}`}>
										{station.performanceTier === 'diamond' ? '◆' : station.performanceTier}
									</span>
								)}
								{station.averageRating !== undefined && station.averageRating > 0 && (
									<div className="flex items-center gap-0.5">
										<Star size={14} weight="fill" className="text-brand" />
										<span className="text-xs font-semibold text-ink">
											{station.averageRating?.toFixed(1)}
										</span>
									</div>
								)}
							</div>
						</div>

						<div className="space-y-1 md:space-y-2">
							{station.location?.address && (
								<div className="flex items-start text-xs md:text-sm text-ink-2">
									<MapPin size={16} weight="regular" className="mr-1 md:mr-2 text-ink-3 mt-0.5 shrink-0" />
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
									<Compass size={16} weight="regular" className="mr-1 md:mr-2" />
									<span>{formatDistance(station.distance)}</span>
								</div>
							)}
							{/* {station.email && (
								<div className="flex items-center text-xs md:text-sm text-ink-2">
									<Mail className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2 text-ink-3 shrink-0" />
									<span className="truncate">{station.email}</span>
								</div>
							)} */}

							{/* Agent Services */}
							{station.agentServices && station.agentServices.length > 0 && (
								<div className="md:pt-2 md:mt-2 border-t border-line">
									<div className="flex items-center gap-1.5 mb-1.5">
										<Package size={16} weight="regular" className="text-brand-ink shrink-0" />
										<span className="text-xs md:text-sm font-bold text-ink">
											Services (
											{station.totalServicesCount ||
												station.agentServices.length}
											)
										</span>
									</div>
									<div className="flex flex-wrap gap-1.5">
										{station.agentServices.slice(0, 5).map((service) => (
											<span
												key={service.id}
												className="px-2 py-0.5 text-xs font-bold text-brand-ink bg-brand/10 border border-brand/30 rounded"
											>
												{service.serviceName}
											</span>
										))}
										{(station.totalServicesCount ||
											station.agentServices.length) > 5 && (
											<span className="px-2 py-0.5 text-xs font-semibold text-ink-2">
												+
												{(station.totalServicesCount ||
													station.agentServices.length) - 5}{" "}
												more
											</span>
										)}
									</div>
								</div>
							)}
						</div>
					</button>
				</div>
			</div>
		</div>
	);
};

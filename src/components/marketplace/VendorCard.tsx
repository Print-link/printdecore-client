import { Star, Storefront } from "@phosphor-icons/react";
import type { MarketplaceVendor } from "../../services/marketplaceApi";
import { openLabel } from "../../utils/storeHours";

/**
 * A shop in a list: picture, open now, rating, distance and what it's known for.
 * A closed shop's card is greyed out and can't be opened until it opens again.
 */
export const VendorCard = ({ vendor, onClick, compact }: { vendor: MarketplaceVendor; onClick: () => void; compact?: boolean }) => {
	const open = openLabel(vendor.operatingHours, vendor.isOpenNow);
	// Unknown hours (null) stay clickable; only a shop we know is closed is disabled
	const closed = vendor.isOpenNow === false;
	const facts = [
		vendor.distanceKm !== undefined ? `${vendor.distanceKm} km` : null,
		vendor.startingPrice !== undefined ? `from GHS ${vendor.startingPrice.toLocaleString()}` : null,
	].filter(Boolean);
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={closed}
			aria-label={closed ? `${vendor.name}, ${open ?? "closed"}` : undefined}
			className={`text-left bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800 shadow-sm transition-all ${
				closed ? "opacity-60 cursor-not-allowed" : "hover:shadow-lg hover:border-[#fbbf24]/40"
			} ${compact ? "min-w-[230px] max-w-[230px]" : "w-full"}`}
		>
			<div className="relative h-28 bg-amber-50 dark:bg-gray-800 flex items-center justify-center">
				{vendor.coverImage ? (
					<img src={vendor.coverImage} alt="" className={`absolute inset-0 w-full h-full object-cover ${closed ? "grayscale" : ""}`} />
				) : (
					<Storefront size={32} className={closed ? "text-gray-400" : "text-[#fbbf24]"} />
				)}
				{open && (
					<span
						className={`absolute top-2 left-2 px-2 py-0.5 text-[11px] font-semibold rounded-full ${
							vendor.isOpenNow ? "bg-green-600 text-white" : "bg-gray-800/80 text-white"
						}`}
					>
						{open}
					</span>
				)}
			</div>
			<div className="p-3">
				<div className="flex items-center gap-2">
					<p className="flex-1 font-bold text-gray-900 dark:text-white truncate">{vendor.name}</p>
					{vendor.rating.count > 0 ? (
						<span className="flex items-center gap-1 text-xs font-semibold text-gray-800 dark:text-gray-200">
							<Star size={12} weight="fill" className="text-[#fbbf24]" />
							{vendor.rating.average.toFixed(1)}
							<span className="font-normal text-gray-500">({vendor.rating.count})</span>
						</span>
					) : (
						<span className="text-xs font-semibold text-[#d97706]">New</span>
					)}
				</div>
				{facts.length > 0 && <p className="text-xs text-gray-500 mt-0.5">{facts.join(" · ")}</p>}
				{vendor.highlights.length > 0 && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 truncate">{vendor.highlights.join(" · ")}</p>}
			</div>
		</button>
	);
};

import { Star, Storefront } from "@phosphor-icons/react";
import type { MarketplaceVendor } from "../../services/marketplaceApi";
import { openLabel } from "../../utils/storeHours";
import { ghs } from "../../utils/ghs";

/**
 * A shop: picture, name and rating, then distance, price and open hours.
 * `compact` is the sideways-scrolling tile on Home; otherwise a full-width card.
 * A shop we know is closed is greyed out and can't be opened until it opens again.
 */
export const VendorCard = ({ vendor, onClick, compact }: { vendor: MarketplaceVendor; onClick: () => void; compact?: boolean }) => {
	const open = openLabel(vendor.operatingHours, vendor.isOpenNow);
	const closed = vendor.isOpenNow === false;
	const facts = [
		vendor.distanceKm !== undefined ? `${vendor.distanceKm} km` : null,
		vendor.startingPrice !== undefined ? `From ${ghs(vendor.startingPrice)}` : null,
	].filter(Boolean);
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={closed}
			aria-label={closed ? `${vendor.name}, ${open ?? "closed"}` : undefined}
			className={`tap snap-start text-left disabled:opacity-100 ${closed ? "cursor-not-allowed" : ""} ${compact ? "shrink-0 w-[256px]" : "w-full"}`}
		>
			<span className={`block relative ${compact ? "h-36" : "h-40 sm:h-44"} rounded-xl overflow-hidden bg-fill ring-1 ring-inset ring-line`}>
				{vendor.coverImage ? (
					<img src={vendor.coverImage} alt="" loading="lazy" className={`absolute inset-0 w-full h-full object-cover ${closed ? "grayscale opacity-60" : ""}`} />
				) : (
					<span className="absolute inset-0 flex items-center justify-center text-ink-3">
						<Storefront size={32} />
					</span>
				)}
				{closed && open && (
					<span className="absolute inset-x-0 bottom-0 px-3 py-1.5 bg-black/70 text-xs font-semibold text-white">{open}</span>
				)}
			</span>
			<span className="flex items-center gap-2 mt-2">
				<span className="flex-1 min-w-0 text-base font-semibold text-ink truncate">{vendor.name}</span>
				{vendor.rating.count > 0 ? (
					<span className="num shrink-0 flex items-center gap-1 text-sm font-semibold text-ink">
						<Star size={13} weight="fill" className="text-brand" />
						{vendor.rating.average.toFixed(1)}
						<span className="font-normal text-ink-3">({vendor.rating.count})</span>
					</span>
				) : (
					<span className="shrink-0 text-xs font-semibold text-brand-ink">New</span>
				)}
			</span>
			<span className="num block text-sm text-ink-2 truncate">
				{[...facts, !closed && open ? open : null].filter(Boolean).join(" · ")}
			</span>
			{!compact && vendor.highlights.length > 0 && <span className="block text-sm text-ink-3 truncate">{vendor.highlights.join(" · ")}</span>}
		</button>
	);
};

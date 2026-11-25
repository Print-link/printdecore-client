import { Clock, MapPin, Star, Storefront, Tag } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { MarketplaceVendor } from "../../services/marketplaceApi";
import { openLabel } from "../../utils/storeHours";
import { ghs } from "../../utils/ghs";

const Fact = ({ icon, children }: { icon: ReactNode; children: ReactNode }) => (
	<span className="inline-flex items-center gap-1 shrink-0">
		<span className="text-ink-2" aria-hidden>
			{icon}
		</span>
		{children}
	</span>
);

/**
 * A shop, food-delivery style: a wide rounded cover with the rating in a white
 * chip at the bottom right, the name in bold, then a line of facts with icons
 * (from-price, distance, open hours). Only what the shop data really has.
 * `compact` is the sideways-scrolling tile on Home; otherwise it fills its grid cell.
 * A shop we know is closed is greyed out and can't be opened until it opens again.
 */
export const VendorCard = ({ vendor, onClick, compact }: { vendor: MarketplaceVendor; onClick: () => void; compact?: boolean }) => {
	const open = openLabel(vendor.operatingHours, vendor.isOpenNow);
	const closed = vendor.isOpenNow === false;
	const rated = vendor.rating.count > 0;
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={closed}
			aria-label={closed ? `${vendor.name}, ${open ?? "closed"}` : undefined}
			className={`tap snap-start text-left disabled:opacity-100 ${closed ? "cursor-not-allowed" : ""} ${compact ? "shrink-0 w-[78vw] max-w-[300px]" : "w-full"}`}
		>
			<span className="block relative aspect-[16/10] rounded-2xl overflow-hidden bg-fill">
				{vendor.coverImage ? (
					<img
						src={vendor.coverImage}
						alt=""
						loading="lazy"
						className={`absolute inset-0 w-full h-full object-cover ${closed ? "grayscale opacity-60" : ""}`}
					/>
				) : (
					<span className="absolute inset-0 flex items-center justify-center text-ink-3">
						<Storefront size={36} />
					</span>
				)}
				{closed && open ? (
					<span className="absolute inset-x-0 bottom-0 px-3 py-2 bg-black/70 text-xs font-semibold text-white">{open}</span>
				) : (
					<span className="num absolute right-2.5 bottom-2.5 inline-flex items-center gap-1 rounded-lg bg-white px-2 py-1 text-[13px] font-semibold text-gray-900 shadow-sm ring-1 ring-black/10">
						{rated ? (
							<>
								<Star size={13} weight="fill" />
								{vendor.rating.average.toFixed(1)}
								<span className="font-normal text-gray-600">({vendor.rating.count.toLocaleString()})</span>
							</>
						) : (
							"New"
						)}
					</span>
				)}
			</span>
			<span className="block mt-2 text-[17px] leading-snug font-bold text-ink truncate">{vendor.name}</span>
			<span className="num mt-0.5 flex items-center gap-x-3 text-sm text-ink-2 overflow-hidden whitespace-nowrap">
				{vendor.startingPrice !== undefined && <Fact icon={<Tag size={15} />}>From {ghs(vendor.startingPrice)}</Fact>}
				{vendor.distanceKm !== undefined && <Fact icon={<MapPin size={15} />}>{vendor.distanceKm} km</Fact>}
				{!closed && open && (
					<Fact icon={<Clock size={15} />}>
						<span className="truncate">{open}</span>
					</Fact>
				)}
			</span>
			{!compact && vendor.highlights.length > 0 && <span className="block mt-0.5 text-sm text-ink-3 truncate">{vendor.highlights.join(" · ")}</span>}
		</button>
	);
};

import { Clock, MapPin, Star, Storefront, Tag } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { MarketplaceVendor } from "../../services/marketplaceApi";
import { openLabel } from "../../utils/storeHours";
import { ghs } from "../../utils/ghs";

const Fact = ({ icon, children, shrink }: { icon: ReactNode; children: ReactNode; shrink?: boolean }) => (
	<span className={`inline-flex items-center gap-1 ${shrink ? "min-w-0" : "shrink-0"}`}>
		<span className="text-ink-2" aria-hidden>
			{icon}
		</span>
		{children}
	</span>
);

/**
 * A shop, food-delivery style: a wide rounded cover with the rating in a white
 * chip at the bottom right, the name in bold, then a line of facts with icons
 * ("GHS 0.30+" from-price, then distance or closing time). Only what the shop data really has.
 * `compact` is the half-screen tile in Home's sideways rows; otherwise it fills a grid cell.
 * A shop we know is closed is greyed out and can't be opened until it opens again.
 */
export const VendorCard = ({ vendor, onClick, compact }: { vendor: MarketplaceVendor; onClick: () => void; compact?: boolean }) => {
	const open = openLabel(vendor.operatingHours, vendor.isOpenNow);
	const closed = vendor.isOpenNow === false;
	const rated = vendor.rating.count > 0;
	// Two facts fit under a small card: the price, then distance (or today's closing time)
	const hours = !closed && open ? open.replace(/^Open · closes/, "Till") : null;
	return (
		<button
			type="button"
			onClick={onClick}
			disabled={closed}
			aria-label={closed ? `${vendor.name}, ${open ?? "closed"}` : undefined}
			className={`tap snap-start text-left min-w-0 disabled:opacity-100 ${closed ? "cursor-not-allowed" : ""} ${compact ? "shrink-0 w-[47vw] max-w-[220px]" : "w-full"}`}
		>
			<span className="block relative aspect-[8/5] rounded-xl overflow-hidden bg-fill">
				{vendor.coverImage ? (
					<img
						src={vendor.coverImage}
						alt=""
						loading="lazy"
						className={`absolute inset-0 w-full h-full object-cover ${closed ? "grayscale opacity-60" : ""}`}
					/>
				) : (
					<span className="absolute inset-0 flex items-center justify-center text-ink-3">
						<Storefront size={28} />
					</span>
				)}
				{closed && open ? (
					<span className="absolute inset-x-0 bottom-0 px-2 py-1 bg-black/70 text-[11px] font-semibold text-white truncate">{open}</span>
				) : (
					<span className="num absolute right-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-md bg-white px-1.5 py-0.5 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-black/10">
						{rated ? (
							<>
								<Star size={11} weight="fill" />
								{vendor.rating.average.toFixed(1)}
								<span className="font-normal text-gray-600">({vendor.rating.count.toLocaleString()})</span>
							</>
						) : (
							"New"
						)}
					</span>
				)}
			</span>
			<span className="block mt-1.5 text-[15px] leading-snug font-semibold text-ink truncate">{vendor.name}</span>
			<span className="num flex items-center gap-x-2.5 text-[13px] text-ink-2 overflow-hidden whitespace-nowrap">
				{vendor.startingPrice !== undefined && <Fact icon={<Tag size={13} />}>{ghs(vendor.startingPrice)}+</Fact>}
				{vendor.distanceKm !== undefined ? (
					<Fact icon={<MapPin size={13} />}>{vendor.distanceKm} km</Fact>
				) : (
					hours && (
						<Fact icon={<Clock size={13} />} shrink>
							<span className="truncate">{hours}</span>
						</Fact>
					)
				)}
			</span>
		</button>
	);
};

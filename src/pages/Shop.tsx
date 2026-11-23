import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CaretDown, CaretRight, Clock, MapPin, Phone, Star, Storefront } from "@phosphor-icons/react";
import { Button, EmptyState, ListRow, RowSkeleton, SectionHeader, Skeleton } from "../components/ui";
import { ghs } from "../utils/ghs";
import { ShopAssistantCard } from "../components/assistant/ShopAssistantCard";
import { useMarketplaceVendor } from "../hooks/useMarketplace";
import type { VendorService } from "../services/marketplaceApi";
import { DAY_LABELS, daysFromToday, formatHours, openLabel } from "../utils/storeHours";

/** One shop: who they are, whether they're open, and what they sell at their prices */
export const Shop = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { data: shop, isLoading, error } = useMarketplaceVendor(id);
	const [showHours, setShowHours] = useState(false);

	const groups = useMemo(() => {
		const byCategory = new Map<string, VendorService[]>();
		(shop?.services ?? []).forEach((s) => {
			const key = s.category?.name || "Products";
			byCategory.set(key, [...(byCategory.get(key) ?? []), s]);
		});
		return [...byCategory.entries()];
	}, [shop?.services]);

	if (isLoading)
		return (
			<div className="max-w-3xl mx-auto">
				<Skeleton className="h-48 -mx-4 sm:mx-0 rounded-none sm:rounded-xl" />
				<Skeleton className="h-7 w-1/2 mt-4" />
				<Skeleton className="h-4 w-1/3 mt-2" />
				<div className="mt-6"><RowSkeleton rows={4} thumb={0} /></div>
			</div>
		);
	if (error || !shop) {
		return (
			<EmptyState
				icon={<Storefront size={26} />}
				title="This shop isn't taking orders right now"
				action={<Button variant="secondary" onClick={() => navigate("/home/shops")}>See other shops</Button>}
			/>
		);
	}

	const open = openLabel(shop.operatingHours, shop.isOpenNow);
	const hasHours = Object.keys(shop.operatingHours || {}).length > 0;
	const mapsUrl =
		shop.latitude != null && shop.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}` : null;

	return (
		<div className="w-full max-w-3xl mx-auto">
			{/* Cover runs edge to edge on phones */}
			<div className="relative -mx-4 -mt-4 sm:mx-0 sm:mt-0 h-48 sm:h-56 sm:rounded-xl overflow-hidden bg-fill flex items-center justify-center sm:ring-1 sm:ring-inset sm:ring-line">
				{shop.coverImage ? <img src={shop.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Storefront size={40} className="text-ink-3" />}
			</div>

			<h1 className="mt-4 text-3xl font-bold title-tight text-ink">{shop.name}</h1>
			<p className="num mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-ink-2">
				{shop.rating.count > 0 ? (
					<span className="inline-flex items-center gap-1 font-semibold text-ink">
						<Star size={14} weight="fill" className="text-brand" /> {shop.rating.average.toFixed(1)}
						<span className="font-normal text-ink-2">
							({shop.rating.count} review{shop.rating.count === 1 ? "" : "s"})
						</span>
					</span>
				) : (
					<span className="font-semibold text-brand-ink">New on Printdecore</span>
				)}
				{shop.distanceKm !== undefined && <span>· {shop.distanceKm} km away</span>}
			</p>

			{/* Facts: hours, address, phone — one hairline list */}
			<div className="mt-4 border-t border-line">
				{open && (
					<>
						<button
							type="button"
							onClick={() => hasHours && setShowHours((v) => !v)}
							aria-expanded={showHours}
							className="tap w-full flex items-center gap-3 py-3 border-b border-line text-left text-sm"
						>
							<Clock size={18} className="text-ink-2" />
							<span className={`flex-1 font-semibold ${shop.isOpenNow ? "text-ok" : "text-ink"}`}>{open}</span>
							{hasHours && <CaretDown size={14} className={`text-ink-3 transition-transform ${showHours ? "rotate-180" : ""}`} />}
						</button>
						{showHours && (
							<dl className="py-2 pl-[30px] border-b border-line text-sm">
								{daysFromToday().map((day, i) => {
									const h = shop.operatingHours[day];
									return (
										<div key={day} className="flex justify-between py-1">
											<dt className={i === 0 ? "font-semibold text-ink" : "text-ink-2"}>{i === 0 ? "Today" : DAY_LABELS[day]}</dt>
											<dd className="num text-ink-2">{h ? formatHours(h) : "Closed"}</dd>
										</div>
									);
								})}
							</dl>
						)}
					</>
				)}
				{shop.address && (
					<a
						href={mapsUrl ?? undefined}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-3 py-3 border-b border-line text-sm text-ink"
					>
						<MapPin size={18} className="text-ink-2" />
						<span className="flex-1 min-w-0 truncate">{shop.address}</span>
						{mapsUrl && <CaretRight size={14} className="text-ink-3" />}
					</a>
				)}
				{shop.phoneNumber && (
					<a href={`tel:${shop.phoneNumber}`} className="num flex items-center gap-3 py-3 border-b border-line text-sm text-ink">
						<Phone size={18} className="text-ink-2" />
						<span className="flex-1">{shop.phoneNumber}</span>
						<span className="font-semibold">Call</span>
					</a>
				)}
			</div>

			<ShopAssistantCard shopId={shop.id} shopName={shop.name} shopImage={shop.coverImage} />

			{groups.length === 0 && <EmptyState title="No products listed yet" body="Ask the shop for a quote instead." />}
			{groups.map(([category, services]) => (
				<section key={category} className="mt-8">
					<SectionHeader title={category} />
					<div className="border-t border-line">
						{services.map((s) => (
							<ListRow
								key={s.agentServiceId}
								title={s.name}
								sub={s.startingPrice !== undefined ? <span className="num">From {ghs(s.startingPrice)}</span> : undefined}
								onClick={() => navigate(`/home/shops/${shop.id}/products/${s.agentServiceId}`)}
							/>
						))}
					</div>
				</section>
			))}
		</div>
	);
};

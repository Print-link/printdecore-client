import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CaretDown, CaretRight, Clock, MapPin, Phone, SpinnerGap, Star, Storefront } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
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

	if (isLoading) return <SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />;
	if (error || !shop) {
		return (
			<div className="max-w-2xl mx-auto">
				<PageHeader title="Shop" />
				<p className="font-semibold text-gray-900 dark:text-white">This shop isn't taking orders right now</p>
				<button type="button" onClick={() => navigate("/home/shops")} className="mt-3 text-sm font-semibold text-[#d97706]">
					See other shops
				</button>
			</div>
		);
	}

	const open = openLabel(shop.operatingHours, shop.isOpenNow);
	const hasHours = Object.keys(shop.operatingHours || {}).length > 0;
	const mapsUrl =
		shop.latitude != null && shop.longitude != null ? `https://www.google.com/maps/search/?api=1&query=${shop.latitude},${shop.longitude}` : null;

	return (
		<div className="w-full max-w-3xl mx-auto">
			<PageHeader title={shop.name} />
			<div className="relative h-44 rounded-2xl overflow-hidden bg-amber-50 dark:bg-gray-800 flex items-center justify-center mb-4">
				{shop.coverImage ? <img src={shop.coverImage} alt="" className="absolute inset-0 w-full h-full object-cover" /> : <Storefront size={40} className="text-[#fbbf24]" />}
			</div>

			<div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
				{shop.rating.count > 0 ? (
					<span className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white">
						<Star size={14} weight="fill" className="text-[#fbbf24]" /> {shop.rating.average.toFixed(1)}
						<span className="font-normal text-gray-500">
							({shop.rating.count} review{shop.rating.count === 1 ? "" : "s"})
						</span>
					</span>
				) : (
					<span className="font-semibold text-[#d97706]">New on Printdecore</span>
				)}
				{shop.distanceKm !== undefined && <span className="text-gray-500">· {shop.distanceKm} km</span>}
			</div>

			{open && (
				<button
					type="button"
					onClick={() => hasHours && setShowHours((v) => !v)}
					aria-expanded={showHours}
					className={`flex items-center gap-1.5 text-sm font-medium ${shop.isOpenNow ? "text-green-600" : "text-gray-700 dark:text-gray-300"}`}
				>
					<Clock size={15} /> {open}
					{hasHours && <CaretDown size={13} className={showHours ? "rotate-180" : ""} />}
				</button>
			)}
			{showHours && (
				<dl className="mt-2 p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-sm space-y-1">
					{daysFromToday().map((day, i) => {
						const h = shop.operatingHours[day];
						return (
							<div key={day} className="flex justify-between">
								<dt className={i === 0 ? "font-semibold text-gray-900 dark:text-white" : "text-gray-700 dark:text-gray-300"}>{i === 0 ? "Today" : DAY_LABELS[day]}</dt>
								<dd className="text-gray-500">{h ? formatHours(h) : "Closed"}</dd>
							</div>
						);
					})}
				</dl>
			)}

			<div className="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
				{shop.address && (
					<p className="flex items-center gap-2">
						<MapPin size={15} className="text-gray-400" />
						{mapsUrl ? (
							<a href={mapsUrl} target="_blank" rel="noreferrer" className="hover:underline">
								{shop.address}
							</a>
						) : (
							shop.address
						)}
					</p>
				)}
				{shop.phoneNumber && (
					<p className="flex items-center gap-2">
						<Phone size={15} className="text-gray-400" />
						<a href={`tel:${shop.phoneNumber}`} className="hover:underline">
							{shop.phoneNumber}
						</a>
					</p>
				)}
			</div>

			<h2 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-3">What they print</h2>
			{groups.length === 0 && <p className="text-sm text-gray-500">This shop hasn't listed any products yet.</p>}
			<div className="space-y-5">
				{groups.map(([category, services]) => (
					<section key={category}>
						<h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-2">{category}</h3>
						<div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden bg-white dark:bg-[#1e1e1e]">
							{services.map((s) => (
								<button
									key={s.agentServiceId}
									type="button"
									onClick={() => navigate(`/home/shops/${shop.id}/products/${s.agentServiceId}`)}
									className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
								>
									<span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-200">{s.name}</span>
									{s.startingPrice !== undefined && <span className="text-xs text-gray-500">from GHS {s.startingPrice.toLocaleString()}</span>}
									<CaretRight size={14} className="text-gray-400" />
								</button>
							))}
						</div>
					</section>
				))}
			</div>
		</div>
	);
};

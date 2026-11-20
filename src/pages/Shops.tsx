import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, MapPin, SpinnerGap, X } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
import { VendorCard } from "../components/marketplace/VendorCard";
import { useGeolocation } from "../hooks/useGeolocation";
import { useMarketplaceVendors } from "../hooks/useMarketplace";

/** The marketplace: print shops that take orders directly, nearest first */
export const Shops = () => {
	const navigate = useNavigate();
	const { userLocation, requestLocation } = useGeolocation();
	const [search, setSearch] = useState("");
	const [query, setQuery] = useState("");
	useEffect(() => {
		const t = setTimeout(() => setQuery(search.trim()), 300);
		return () => clearTimeout(t);
	}, [search]);
	const { data: vendors = [], isLoading, error, refetch } = useMarketplaceVendors(userLocation, query);

	return (
		<div className="w-full max-w-5xl mx-auto">
			<PageHeader title="Print shops" subtitle="Choose a shop and order at its prices. Pay now — they confirm a ready-by time." />

			<div className="relative mb-4">
				<MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
				<input
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					placeholder="Search shops or what they print (e.g. banners)"
					aria-label="Search shops"
					className="w-full pl-10 pr-10 py-3 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50"
				/>
				{search && (
					<button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" aria-label="Clear search">
						<X size={16} />
					</button>
				)}
			</div>

			{!userLocation && (
				<button
					type="button"
					onClick={requestLocation}
					className="w-full mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-sm text-gray-800 dark:text-gray-200"
				>
					<MapPin size={16} className="text-[#d97706]" /> Turn on location to see the shops closest to you
				</button>
			)}

			{isLoading ? (
				<SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />
			) : error ? (
				<div className="text-center py-10">
					<p className="font-semibold text-gray-900 dark:text-white">Couldn't load shops</p>
					<button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-[#d97706]">
						Try again
					</button>
				</div>
			) : vendors.length === 0 ? (
				<div className="text-center py-10">
					<p className="font-semibold text-gray-900 dark:text-white">{query ? `No shops match "${query}"` : "No shops near you yet"}</p>
					<p className="text-sm text-gray-500 mt-1">You can still order — Printdecore finds a printer and handles everything.</p>
					<button type="button" onClick={() => navigate("/home")} className="mt-4 px-4 py-2.5 bg-[#fbbf24] text-black text-sm font-bold rounded-xl">
						Order through Printdecore
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
					{vendors.map((v) => (
						<VendorCard key={v.id} vendor={v} onClick={() => navigate(`/home/shops/${v.id}`)} />
					))}
				</div>
			)}
		</div>
	);
};

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, MapPin, Storefront, X } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
import { VendorCard } from "../components/marketplace/VendorCard";
import { useGeolocation } from "../hooks/useGeolocation";
import { useMarketplaceVendors } from "../hooks/useMarketplace";
import { Button, EmptyState, Field, Skeleton } from "../components/ui";

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

			<Field
				wrapClassName="mb-4"
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				placeholder="Search shops or what they print"
				aria-label="Search shops"
				leading={<MagnifyingGlass size={18} />}
				trailing={
					search ? (
						<button type="button" onClick={() => setSearch("")} className="tap p-1 -mr-1 text-ink-3" aria-label="Clear search">
							<X size={16} />
						</button>
					) : undefined
				}
			/>

			{!userLocation && (
				<button type="button" onClick={requestLocation} className="tap w-full mb-4 flex items-center gap-2 text-sm text-ink-2">
					<MapPin size={16} /> <span className="flex-1 text-left">Sorted by name.</span> <span className="font-semibold text-ink">Show nearest first</span>
				</button>
			)}

			{isLoading ? (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
					{[0, 1, 2].map((i) => (
						<div key={i}>
							<Skeleton className="aspect-[16/10] rounded-2xl" />
							<Skeleton className="h-4 w-2/3 mt-3" />
							<Skeleton className="h-3 w-1/3 mt-2" />
						</div>
					))}
				</div>
			) : error ? (
				<EmptyState title="Couldn't load shops" body="Check your connection and try again." action={<Button variant="secondary" onClick={() => refetch()}>Try again</Button>} />
			) : vendors.length === 0 ? (
				<EmptyState
					icon={<Storefront size={26} />}
					title={query ? `No shops match "${query}"` : "No shops near you yet"}
					body="You can still order. Printdecore finds a printer and handles everything."
					action={<Button onClick={() => navigate("/home")}>Order through Printdecore</Button>}
				/>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-6">
					{vendors.map((v) => (
						<VendorCard key={v.id} vendor={v} onClick={() => navigate(`/home/shops/${v.id}`)} />
					))}
				</div>
			)}
		</div>
	);
};

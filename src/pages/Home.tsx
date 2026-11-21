import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { AssistantSpotlight } from "../components/assistant/AssistantSpotlight";
import { ActiveOrdersStrip } from "../components/order/ActiveOrdersStrip";
import { useGeolocation } from "../hooks/useGeolocation";
import { useCategories } from "../hooks/useCategories";
import { useMarketplaceVendors } from "../hooks/useMarketplace";
import { CategoryCardHorizontal } from "../components/CategoryCardHorizontal";
import { HorizontalScrollSection } from "../components/HorizontalScrollSection";
import { VendorCard } from "../components/marketplace/VendorCard";

/**
 * Two ways to order: let Printdecore handle it (the catalogue, or the Print
 * Assistant for anything unusual), or choose a shop and order at its prices.
 */
export const Home = () => {
	const navigate = useNavigate();
	const [search, setSearch] = useState("");
	const { userLocation } = useGeolocation();
	const { data: categories = [], isLoading: categoriesLoading } = useCategories();
	const { data: shops = [] } = useMarketplaceVendors(userLocation);

	return (
		<div className="w-full max-w-5xl mx-auto">
			<ActiveOrdersStrip />
			<div className="mb-8 mt-1">
				<p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Printdecore</p>
				<h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-5 leading-tight">What do you need printed?</h1>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (search.trim()) navigate(`/home/search?q=${encodeURIComponent(search.trim())}`);
					}}
					className="relative"
				>
					<MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
					<input
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Business cards, banners, flyers…"
						aria-label="Search products"
						className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24]"
					/>
				</form>
			</div>

			<AssistantSpotlight />
			<button
				type="button"
				onClick={() => navigate("/home/shops")}
				className="tap w-full mb-8 flex items-center gap-3 p-4 text-left rounded-2xl bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 hover:border-[#fbbf24]"
			>
				<Storefront size={28} weight="duotone" className="text-[#d97706] shrink-0" />
				<span className="flex-1 min-w-0">
					<span className="block font-bold text-gray-900 dark:text-white">Choose a print shop</span>
					<span className="block text-sm text-gray-600 dark:text-gray-400">Order from a shop near you at its prices, and pay now.</span>
				</span>
			</button>

			{!categoriesLoading && categories.length > 0 && (
				<HorizontalScrollSection title="Order through Printdecore" subtitle="We find a printer near you and handle it">
					{categories.map((category) => (
						<CategoryCardHorizontal
							key={category.id}
							category={category}
							onCategoryClick={(id) => navigate(`/home/category/${id}?name=${encodeURIComponent(category.name)}`)}
						/>
					))}
				</HorizontalScrollSection>
			)}

			{shops.length > 0 && (
				<HorizontalScrollSection title="Print shops near you" subtitle="Their prices, paid at checkout" showAllLink="/home/shops">
					{shops.slice(0, 10).map((shop) => (
						<VendorCard key={shop.id} vendor={shop} compact onClick={() => navigate(`/home/shops/${shop.id}`)} />
					))}
				</HorizontalScrollSection>
			)}
		</div>
	);
};

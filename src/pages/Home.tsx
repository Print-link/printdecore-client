import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MagnifyingGlass, Storefront } from "@phosphor-icons/react";
import { AssistantSpotlight } from "../components/assistant/AssistantSpotlight";
import { ActiveOrdersStrip } from "../components/order/ActiveOrdersStrip";
import { InstallBanner } from "../components/pwa/InstallBanner";
import { useGeolocation } from "../hooks/useGeolocation";
import { useCategories } from "../hooks/useCategories";
import { useMarketplaceVendors } from "../hooks/useMarketplace";
import { CategoryCardHorizontal } from "../components/CategoryCardHorizontal";
import { HorizontalScrollSection } from "../components/HorizontalScrollSection";
import { VendorCard } from "../components/marketplace/VendorCard";
import { Field, ListRow, SectionHeader, Thumb } from "../components/ui";

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
			{/* Search comes first and stays on screen: it sticks under the app header
			    (which itself clears the iPhone notch) while the page scrolls under it */}
			<div className="sticky top-under-header z-20 -mx-4 sm:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 mb-4 px-4 sm:px-6 lg:px-8 py-3 bg-page">
				<form
					onSubmit={(e) => {
						e.preventDefault();
						if (search.trim()) navigate(`/home/search?q=${encodeURIComponent(search.trim())}`);
					}}
				>
					<Field
						type="search"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Business cards, banners, flyers…"
						aria-label="Search products"
						leading={<MagnifyingGlass size={18} />}
					/>
				</form>
			</div>

			<ActiveOrdersStrip />
			<InstallBanner />
			<AssistantSpotlight />

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

			{shops.length === 0 && <section className="mb-7">
				<SectionHeader title="Order from a shop" />
				<ListRow
					leading={<Thumb size={44}><Storefront size={22} /></Thumb>}
					title="Choose a print shop"
					sub="Their prices, paid now, ready by a set time"
					onClick={() => navigate("/home/shops")}
					divider={false}
				/>
			</section>}

			{shops.length > 0 && (
				<HorizontalScrollSection title="Print shops near you" subtitle="Order at their prices and pay now" showAllLink="/home/shops">
					{shops.slice(0, 10).map((shop) => (
						<VendorCard key={shop.id} vendor={shop} compact onClick={() => navigate(`/home/shops/${shop.id}`)} />
					))}
				</HorizontalScrollSection>
			)}
		</div>
	);
};

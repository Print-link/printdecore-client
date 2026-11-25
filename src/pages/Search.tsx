import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { Button, EmptyState, Field, ListRow, RowSkeleton, SectionHeader } from "../components/ui";
import { ghs } from "../utils/ghs";
import { VendorCard } from "../components/marketplace/VendorCard";
import { useGeolocation } from "../hooks/useGeolocation";
import { useMarketplaceVendors } from "../hooks/useMarketplace";
import { searchServices } from "../services/serviceSearchApi";

/** Search Printdecore's products and the shops that print them */
export const Search = () => {
	const navigate = useNavigate();
	const [params, setParams] = useSearchParams();
	const q = params.get("q") ?? "";
	const [text, setText] = useState(q);
	const { userLocation } = useGeolocation();
	useEffect(() => setText(q), [q]);

	const { data: products = [], isLoading } = useQuery({
		queryKey: ["serviceSearch", q],
		queryFn: () => searchServices(q ? { q, limit: 30 } : { limit: 30 }),
	});
	const { data: shops = [] } = useMarketplaceVendors(userLocation, q || undefined);

	return (
		<div className="w-full max-w-5xl mx-auto">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					setParams(text.trim() ? { q: text.trim() } : {});
				}}
				className="mb-6"
			>
				<Field
					type="search"
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Business cards, banners, flyers…"
					aria-label="Search"
					leading={<MagnifyingGlass size={18} />}
				/>
			</form>

			<SectionHeader title={q ? `Products for “${q}”` : "Popular products"} />
			{isLoading ? (
				<RowSkeleton rows={5} thumb={0} />
			) : products.length === 0 ? (
				<EmptyState
					icon={<MagnifyingGlass size={26} />}
					title="Nothing matches yet"
					body="Describe it to the Print Assistant and we'll quote it."
					action={<Button variant="secondary" onClick={() => navigate("/home/print-assistant")}>Ask the Print Assistant</Button>}
				/>
			) : (
				<div className="border-t border-line mb-8">
					{products.map((p) => (
						<ListRow
							key={p.serviceTemplateId}
							title={p.name}
							sub={`${p.categoryName} · ${p.subCategoryName}`}
							trailing={
								<span className="num shrink-0 text-sm text-ink-2">
									{p.quoteOnRequest ? "Quote" : p.startingPrice !== undefined ? `From ${ghs(p.startingPrice)}` : ""}
								</span>
							}
							onClick={() => navigate(`/home/product/${p.serviceTemplateId}`)}
						/>
					))}
				</div>
			)}

			{shops.length > 0 && (
				<section className="mt-8">
					<SectionHeader title={q ? "Shops that print it" : "Print shops near you"} />
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-3 gap-y-5">
						{shops.map((s) => (
							<VendorCard key={s.id} vendor={s} onClick={() => navigate(`/home/shops/${s.id}`)} />
						))}
					</div>
				</section>
			)}
		</div>
	);
};

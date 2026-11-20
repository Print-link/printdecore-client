import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { CaretRight, MagnifyingGlass, SpinnerGap } from "@phosphor-icons/react";
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
				className="relative mb-6"
			>
				<MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
				<input
					type="search"
					autoFocus
					value={text}
					onChange={(e) => setText(e.target.value)}
					placeholder="Business cards, banners, flyers…"
					aria-label="Search"
					className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50"
				/>
			</form>

			<h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">{q ? `Products matching "${q}"` : "Popular products"}</h2>
			{isLoading ? (
				<SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />
			) : products.length === 0 ? (
				<p className="text-sm text-gray-500 mb-8">
					Nothing matches yet.{" "}
					<button type="button" onClick={() => navigate("/home/print-assistant")} className="text-[#d97706] font-semibold hover:underline">
						Ask the Print Assistant
					</button>{" "}
					and we'll quote it.
				</p>
			) : (
				<div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden bg-white dark:bg-[#1e1e1e] mb-8">
					{products.map((p) => (
						<button
							key={p.serviceTemplateId}
							type="button"
							onClick={() => navigate(`/home/product/${p.serviceTemplateId}`)}
							className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
						>
							<span className="flex-1 min-w-0">
								<span className="block text-sm font-semibold text-gray-900 dark:text-white">{p.name}</span>
								<span className="block text-xs text-gray-500">
									{p.categoryName} · {p.subCategoryName}
									{p.quoteOnRequest ? " · quote on request" : p.startingPrice !== undefined ? ` · from GHS ${p.startingPrice.toLocaleString()}` : ""}
								</span>
							</span>
							<CaretRight size={14} className="text-gray-400" />
						</button>
					))}
				</div>
			)}

			{shops.length > 0 && (
				<>
					<h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">{q ? "Shops that print it" : "Print shops near you"}</h2>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
						{shops.map((s) => (
							<VendorCard key={s.id} vendor={s} onClick={() => navigate(`/home/shops/${s.id}`)} />
						))}
					</div>
				</>
			)}
		</div>
	);
};

import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { CaretRight, SpinnerGap } from "@phosphor-icons/react";
import { PageHeader } from "../components/common/PageHeader";
import { useSubCategories } from "../hooks/useCategories";
import { useServiceTemplates } from "../hooks/useServices";
import type { SubCategory } from "../services/orderApi";

/** Printdecore's catalogue for one category: its products, grouped by sub-category */
export const CatalogueCategory = () => {
	const { id } = useParams<{ id: string }>();
	const [params] = useSearchParams();
	const { data: subCategories, isLoading } = useSubCategories(id);

	return (
		<div className="w-full max-w-3xl mx-auto">
			<PageHeader title={params.get("name") || "Category"} subtitle="Choose a product to set it up and see its price" />
			{isLoading && <SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />}
			{!isLoading && !subCategories?.length && <p className="text-sm text-gray-500">Nothing available in this category yet.</p>}
			<div className="space-y-6">
				{subCategories?.map((s) => <SubCategorySection key={s.id} subCategory={s} />)}
			</div>
		</div>
	);
};

const SubCategorySection = ({ subCategory }: { subCategory: SubCategory }) => {
	const navigate = useNavigate();
	const { data: templates, isLoading } = useServiceTemplates(subCategory.id);
	if (!isLoading && !templates?.length) return null;
	return (
		<section>
			<h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">{subCategory.name}</h2>
			<div className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden bg-white dark:bg-[#1e1e1e]">
				{isLoading && <p className="px-4 py-3 text-sm text-gray-500">Loading…</p>}
				{templates?.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => navigate(`/home/product/${t.id}`)}
						className="w-full flex items-center justify-between px-4 py-3.5 text-left text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
					>
						{t.name}
						<CaretRight size={14} className="text-gray-400" />
					</button>
				))}
			</div>
		</section>
	);
};

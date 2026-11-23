import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { PageHeader } from "../components/common/PageHeader";
import { EmptyState, ListRow, RowSkeleton, SectionHeader } from "../components/ui";
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
			{isLoading && <RowSkeleton rows={6} thumb={0} />}
			{!isLoading && !subCategories?.length && <EmptyState title="Nothing here yet" body="Nothing is available in this category yet." />}
			<div className="space-y-8">
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
			<SectionHeader title={subCategory.name} />
			<div className="border-t border-line">
				{isLoading && <RowSkeleton rows={2} thumb={0} />}
				{templates?.map((t) => (
					<ListRow key={t.id} title={t.name} onClick={() => navigate(`/home/product/${t.id}`)} />
				))}
			</div>
		</section>
	);
};

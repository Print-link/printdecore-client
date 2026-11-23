import { TagChevron } from "@phosphor-icons/react";
import type { Category } from "../../types/category";

interface CategoryInfoProps {
	category: Category;
}

export const CategoryInfo = ({ category }: CategoryInfoProps) => {
	return (
		<div className="py-5 border-t border-line">
			<div className="flex items-start gap-4">
				{category?.imageUrl ? (
					<div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-line">
						<img
							src={category?.imageUrl}
							alt={category?.name}
							className="w-full h-full object-cover"
						/>
					</div>
				) : (
					<div className="w-20 h-20 rounded-xl bg-fill border border-line flex items-center justify-center shrink-0">
						<TagChevron size={32} weight="regular" className="text-ink-3" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h2 className="text-lg font-bold text-ink mb-1">{category?.name}</h2>
					<p className="text-sm text-ink-2 leading-relaxed mb-2">
						{category?.description || "No description available"}
					</p>
					{category?.unitPrice && (
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-fill rounded-lg border border-line">
							<span className="text-xs text-ink-2 font-medium">Unit Price</span>
							<span className="text-sm font-bold text-ink">
								GHS {category?.unitPrice?.toFixed(2)}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

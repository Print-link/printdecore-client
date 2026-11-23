import { Tag } from "@phosphor-icons/react";
import type { Category } from "../services/orderApi";

interface CategoryCardHorizontalProps {
	category: Category;
	onCategoryClick: (categoryId: string) => void;
}

/** A category tile: picture with a hairline edge, name and one line under it */
export const CategoryCardHorizontal = ({ category, onCategoryClick }: CategoryCardHorizontalProps) => (
	<button type="button" onClick={() => onCategoryClick(category.id)} className="tap snap-start shrink-0 w-[148px] sm:w-[168px] text-left">
		<span className="block relative aspect-[4/3] rounded-xl overflow-hidden bg-fill ring-1 ring-inset ring-line">
			{category.imageUrl ? (
				<img className="absolute inset-0 w-full h-full object-cover" src={category.imageUrl} alt="" loading="lazy" />
			) : (
				<span className="absolute inset-0 flex items-center justify-center text-ink-3">
					<Tag size={28} />
				</span>
			)}
		</span>
		<span className="block mt-2 text-sm font-semibold text-ink truncate">{category.name}</span>
		{category.description && <span className="block text-xs text-ink-2 truncate">{category.description}</span>}
	</button>
);

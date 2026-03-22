import { Tag } from "lucide-react";
import type { Category } from "../services/orderApi";

interface CategoryCardHorizontalProps {
  category: Category;
  onCategoryClick: (categoryId: string) => void;
}

export const CategoryCardHorizontal = ({
  category,
  onCategoryClick,
}: CategoryCardHorizontalProps) => {
  return (
    <div
      className="relative bg-white dark:bg-[#1e1e1e] rounded-2xl overflow-hidden min-w-[150px] max-w-[150px] sm:min-w-[170px] sm:max-w-[170px] cursor-pointer border border-gray-100 dark:border-gray-800 shadow-sm shadow-black/5 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-1 hover:border-[#fbbf24]/40 transition-all duration-200"
      onClick={() => onCategoryClick(category.id)}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        {category.imageUrl ? (
          <img
            className="w-full h-24 object-cover"
            src={category.imageUrl}
            alt={category.name}
          />
        ) : (
          <div className="w-full h-24 bg-linear-to-br from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
            <Tag className="w-7 h-7 text-[#fbbf24]" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-black text-gray-900 dark:text-white text-sm line-clamp-1 leading-tight mb-1">
          {category.name}
        </h3>
        {category.description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 line-clamp-2 leading-snug">
            {category.description}
          </p>
        )}
      </div>
    </div>
  );
};

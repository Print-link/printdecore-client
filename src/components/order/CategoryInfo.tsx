import { TagChevron } from "@phosphor-icons/react";
import type { Category } from "../../types/category";

interface CategoryInfoProps {
	category: Category;
}

export const CategoryInfo = ({ category }: CategoryInfoProps) => {
	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
			<div className="flex items-start gap-4">
				{category?.imageUrl ? (
					<div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 dark:border-gray-800">
						<img
							src={category?.imageUrl}
							alt={category?.name}
							className="w-full h-full object-cover"
						/>
					</div>
				) : (
					<div className="w-20 h-20 rounded-xl bg-gray-50 dark:bg-[#161616] border border-gray-100 dark:border-gray-800 flex items-center justify-center shrink-0">
						<TagChevron size={32} weight="duotone" className="text-gray-300 dark:text-gray-600" />
					</div>
				)}
				<div className="flex-1 min-w-0">
					<h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{category?.name}</h2>
					<p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-2">
						{category?.description || "No description available"}
					</p>
					{category?.unitPrice && (
						<div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-[#161616] rounded-lg border border-gray-100 dark:border-gray-800">
							<span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Unit Price</span>
							<span className="text-sm font-bold text-gray-900 dark:text-white">
								GHS {category?.unitPrice?.toFixed(2)}
							</span>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

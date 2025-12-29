import { Tag } from "lucide-react";
import type { Category } from "../../types/category";

interface CategoryInfoProps {
	category: Category;
}

export const CategoryInfo = ({ category }: CategoryInfoProps) => {
	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			{category?.imageUrl ? (
				<div className="flex justify-center h-44 w-44 rounded-lg overflow-hidden">
					<img
						src={category?.imageUrl}
						alt={category?.name}
						className="w-full h-full object-cover"
					/>
				</div>
			) : (
				<div className="flex justify-center">
					<Tag className="w-6 h-6 text-[#fbbf24]" />
				</div>
			)}
			<h2 className="text-xl font-bold text-gray-900">{category?.name}</h2>
			<span className="text-sm text-gray-600">
				{category?.description || "No description available"} -
			</span>
			{category?.unitPrice && (
				<p className="text-sm text-gray-600">
					Unit Price:{" "}
					<span className="font-semibold text-gray-900">
						GHS {category?.unitPrice?.toFixed(2)}
					</span>
				</p>
			)}
		</div>
	);
};


import { Tag } from "lucide-react";

interface CategoryInfoProps {
	name: string;
	unitPrice: number;
}

export const CategoryInfo = ({ name, unitPrice }: CategoryInfoProps) => {
	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<div className="flex items-center gap-3 mb-3">
				<Tag className="w-6 h-6 text-[#63A361]" />
				<h2 className="text-xl font-bold text-gray-900">
					{name}
				</h2>
			</div>
			<p className="text-sm text-gray-600">
				Unit Price:{" "}
				<span className="font-semibold text-gray-900">
					GHS {unitPrice.toFixed(2)}
				</span>
			</p>
		</div>
	);
};


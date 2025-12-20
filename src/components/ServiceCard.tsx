import { useNavigate } from "react-router-dom";
import { MapPin, DollarSign, Check, Package } from "lucide-react";
import type { SearchResult } from "../services/orderApi";

interface ServiceCardProps {
	result: SearchResult;
}

export const ServiceCard = ({ result }: ServiceCardProps) => {
	const navigate = useNavigate();

	console.log("services ----", result)

	const handleClick = () => {
		// Navigate to agent services page for the first available branch
		if (result.branches && result.branches.length > 0) {
			const branch = result.branches[0];
			navigate(
				`/order/agent-services/${branch.branchId}?serviceTemplateId=${result.service.id}`
			);
		}
	};

	const getPricingTypeColor = (type: string) => {
		switch (type) {
			case "AREA_BASED":
				return "bg-blue-100 text-blue-700";
			case "UNIT_BASED":
				return "bg-green-100 text-green-700";
			case "MIXED":
				return "bg-purple-100 text-purple-700";
			case "CUSTOM_QUOTE":
				return "bg-orange-100 text-orange-700";
			default:
				return "bg-gray-100 text-gray-700";
		}
	};

	return (
		<button
			onClick={handleClick}
			className="w-full bg-white rounded-xl p-6 border border-gray-300 text-left hover:border-[#63A361]  transition-all group"
		>
			{/* Header */}
			<div className="flex items-start justify-between mb-4">
				<div className="flex-1">
					<div className="flex items-center gap-2 mb-2">
						{result.category.imageUrl ? (
							<img
								src={result.category.imageUrl}
								alt={result.category.name}
								className="w-8 h-8 rounded"
							/>
						) : (
							<div className="w-8 h-8 bg-[#FFF9E6] rounded flex items-center justify-center">
								<Package className="w-4 h-4 text-[#63A361]" />
							</div>
						)}
						<div>
							<div className="text-xs text-gray-500">{result.category.name}</div>
							<div className="text-xs text-gray-400">
								{result.subCategory.name}
							</div>
						</div>
					</div>
					<h3 className="text-lg font-bold text-gray-900 group-hover:text-[#63A361] transition-colors">
						{result.service.name}
					</h3>
				</div>
				<span
					className={`px-2 py-1 rounded text-xs font-medium ${getPricingTypeColor(
						result.subCategory.pricingType
					)}`}
				>
					{result.subCategory.pricingType.replace("_", " ")}
				</span>
			</div>

			{/* Service Features */}
			<div className="flex flex-wrap gap-2 mb-4">
				{result.service.allowsCustomSize && (
					<div className="flex items-center gap-1 text-xs text-gray-600">
						<Check className="w-3 h-3 text-[#63A361]" />
						Custom Size
					</div>
				)}
				{result.service.supportsFrontBack && (
					<div className="flex items-center gap-1 text-xs text-gray-600">
						<Check className="w-3 h-3 text-[#63A361]" />
						Front & Back
					</div>
				)}
				{result.service.supportsColor && (
					<div className="flex items-center gap-1 text-xs text-gray-600">
						<Check className="w-3 h-3 text-[#63A361]" />
						Color
					</div>
				)}
				{result.service.supportsPrintCut && (
					<div className="flex items-center gap-1 text-xs text-gray-600">
						<Check className="w-3 h-3 text-[#63A361]" />
						Print & Cut
					</div>
				)}
			</div>

			{/* Price Information */}
			{result.priceRange && (
				<div className="mb-4">
					<div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
						<DollarSign className="w-4 h-4" />
						<span>Price Range:</span>
					</div>
					<div className="text-lg font-bold text-[#63A361]">
						GHS {result.priceRange.min.toFixed(2)} - GHS{" "}
						{result.priceRange.max.toFixed(2)}
					</div>
					{result.estimatedPrice && (
						<div className="text-xs text-gray-500 mt-1">
							Estimated: GHS {result.estimatedPrice.toFixed(2)}
						</div>
					)}
				</div>
			)}

			{/* Branches */}
			{result.branches && result.branches.length > 0 && (
				<div className="pt-4 border-t border-gray-200">
					<div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
						<MapPin className="w-4 h-4" />
						<span>
							{result.branches.length} branch
							{result.branches.length !== 1 ? "es" : ""} available
						</span>
					</div>
					<div className="space-y-1">
						{result.branches.slice(0, 3).map((branch) => (
							<div
								key={branch.id}
								className="flex items-center justify-between text-xs"
							>
								<span className="text-gray-700">{branch.branchName}</span>
								{branch.distance && (
									<span className="text-gray-500">
										{branch.distance.toFixed(1)} km
									</span>
								)}
							</div>
						))}
						{result.branches.length > 3 && (
							<div className="text-xs text-[#63A361]">
								+{result.branches.length - 3} more
							</div>
						)}
					</div>
				</div>
			)}

			{/* Action */}
			<div className="mt-4 pt-4 border-t border-gray-200">
				<span className="text-sm font-medium text-[#63A361] group-hover:text-[#E6B00D]">
					View Pricing & Order →
				</span>
			</div>
		</button>
	);
};


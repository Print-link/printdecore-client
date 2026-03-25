import { useNavigate } from "react-router-dom";
import { MapPin, CurrencyDollar, Check, Package } from "@phosphor-icons/react";
import type { SearchResult } from "../services/orderApi";

interface ServiceCardProps {
	result: SearchResult;
}

export const ServiceCard = ({ result }: ServiceCardProps) => {
	const navigate = useNavigate();

	console.log("services ----", result)

	const handleBranchClick = (branchId: string, e?: React.MouseEvent) => {
		e?.stopPropagation();
		navigate(
			`/home/order/configure/${branchId}?serviceTemplateId=${result.service.id}`
		);
	};

	const handleClick = () => {
		if (result.branches && result.branches.length > 0) {
			// If only one branch, go directly to order form
			if (result.branches.length === 1) {
				handleBranchClick(result.branches[0].branchId);
			}
			// If multiple branches, do nothing — user picks a branch from the list below
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
			className="w-full bg-white dark:bg-[#1e1e1e] rounded-xl p-6 border border-gray-300 dark:border-gray-600 text-left hover:border-[#fbbf24]  transition-all group"
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
								<Package size={16} weight="duotone" className="text-[#fbbf24]" />
							</div>
						)}
						<div>
							<div className="text-xs text-gray-500 dark:text-gray-400">{result.category.name}</div>
							<div className="text-xs text-gray-400 dark:text-gray-500">
								{result.subCategory.name}
							</div>
						</div>
					</div>
					<h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-[#fbbf24] transition-colors">
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
					<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
						<Check size={12} weight="regular" className="text-[#fbbf24]" />
						Custom Size
					</div>
				)}
				{result.service.supportsFrontBack && (
					<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
						<Check size={12} weight="regular" className="text-[#fbbf24]" />
						Front & Back
					</div>
				)}
				{result.service.supportsColor && (
					<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
						<Check size={12} weight="regular" className="text-[#fbbf24]" />
						Color
					</div>
				)}
				{result.service.supportsPrintCut && (
					<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
						<Check size={12} weight="regular" className="text-[#fbbf24]" />
						Print & Cut
					</div>
				)}
			</div>

			{/* Price Information */}
			{result.priceRange && (
				<div className="mb-4">
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
						<CurrencyDollar size={16} weight="regular" />
						<span>Price Range:</span>
					</div>
					<div className="text-lg font-bold text-[#fbbf24]">
						GHS {result.priceRange.min.toFixed(2)} - GHS{" "}
						{result.priceRange.max.toFixed(2)}
					</div>
					{result.estimatedPrice && (
						<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
							Estimated: GHS {result.estimatedPrice.toFixed(2)}
						</div>
					)}
				</div>
			)}

			{/* Branches — each one is clickable to order */}
			{result.branches && result.branches.length > 0 && (
				<div className="pt-4 border-t border-gray-200 dark:border-gray-700">
					<div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
						<MapPin size={16} weight="regular" />
						<span>
							{result.branches.length} branch
							{result.branches.length !== 1 ? "es" : ""} available
						</span>
					</div>
					<div className="space-y-1.5">
						{result.branches.slice(0, 3).map((branch) => (
							<div
								key={branch.id}
								onClick={(e) => handleBranchClick(branch.branchId, e)}
								className="flex items-center justify-between text-xs px-2.5 py-2 -mx-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/10 cursor-pointer transition-colors"
							>
								<span className="text-gray-700 dark:text-gray-300 font-medium">{branch.branchName}</span>
								<div className="flex items-center gap-2">
									{branch.pricePerUnit != null && (
										<span className="text-[#fbbf24] font-semibold">
											GHS {branch.pricePerUnit.toFixed(2)}
										</span>
									)}
									{branch.distance != null && (
										<span className="text-gray-400 dark:text-gray-500">
											{branch.distance.toFixed(1)} km
										</span>
									)}
									<span className="text-[#fbbf24]">→</span>
								</div>
							</div>
						))}
						{result.branches.length > 3 && (
							<div className="text-xs text-[#fbbf24] px-2.5">
								+{result.branches.length - 3} more
							</div>
						)}
					</div>
				</div>
			)}

			{/* Action */}
			{result.branches && result.branches.length === 1 && (
				<div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
					<span className="text-sm font-medium text-[#fbbf24] group-hover:text-[#d97706]">
						View Pricing & Order →
					</span>
				</div>
			)}
			{result.branches && result.branches.length > 1 && (
				<div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
					<span className="text-xs text-gray-400 dark:text-gray-500">
						Select a branch above to order
					</span>
				</div>
			)}
		</button>
	);
};


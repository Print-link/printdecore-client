import { X, Sliders } from "lucide-react";
import type { SearchFilters, SearchResponse } from "../services/orderApi";

interface FilterSidebarProps {
	filters: SearchFilters;
	onFilterChange: (newFilters: Partial<SearchFilters>) => void;
	aggregations?: SearchResponse["aggregations"];
	onClose?: () => void;
}

export const FilterSidebar = ({
	filters,
	onFilterChange,
	aggregations,
	onClose,
}: FilterSidebarProps) => {
	const hasActiveFilters =
		filters.categoryId ||
		filters.pricingType ||
		filters.minPrice ||
		filters.maxPrice ||
		filters.supportsColor ||
		filters.supportsFrontBack ||
		filters.supportsPrintCut ||
		filters.allowsCustomSize;

	const clearFilters = () => {
		onFilterChange({
			categoryId: undefined,
			pricingType: undefined,
			minPrice: undefined,
			maxPrice: undefined,
			supportsColor: undefined,
			supportsFrontBack: undefined,
			supportsPrintCut: undefined,
			allowsCustomSize: undefined,
			page: 1,
		});
	};

	return (
		<div className="bg-white rounded-xl border border-gray-300 p-6 h-fit">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<Sliders className="w-5 h-5 text-gray-700" />
					<h3 className="text-lg font-semibold text-gray-900">Filters</h3>
				</div>
				{onClose && (
					<button
						onClick={onClose}
						className="md:hidden text-gray-500 hover:text-gray-700"
					>
						<X className="w-5 h-5" />
					</button>
				)}
			</div>

			{hasActiveFilters && (
				<button
					onClick={clearFilters}
					className="w-full mb-4 px-4 py-2 text-sm font-medium text-[#63A361] hover:text-[#63A361] border border-white rounded-lg hover:bg-white"
				>
					Clear All Filters
				</button>
			)}

			<div className="space-y-6">
				{/* Category Filter */}
				{aggregations?.categories && aggregations.categories.length > 0 && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Category
						</label>
						<div className="space-y-2">
							{aggregations.categories.map((cat) => (
								<label
									key={cat.id}
									className="flex items-center gap-2 cursor-pointer"
								>
									<input
										type="radio"
										name="category"
										checked={filters.categoryId === cat.id}
										onChange={() =>
											onFilterChange({ categoryId: cat.id, page: 1 })
										}
										className="w-4 h-4 text-[#63A361]"
									/>
									<span className="text-sm text-gray-700">
										{cat.name} ({cat.count})
									</span>
								</label>
							))}
						</div>
					</div>
				)}

				{/* Price Range Filter */}
				{aggregations?.priceRange && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Price Range (GHS)
						</label>
						<div className="space-y-3">
							<div>
								<label className="block text-xs text-gray-500 mb-1">Min</label>
								<input
									type="number"
									min={aggregations.priceRange.min}
									max={aggregations.priceRange.max}
									value={filters.minPrice || ""}
									onChange={(e) =>
										onFilterChange({
											minPrice: e.target.value
												? parseFloat(e.target.value)
												: undefined,
											page: 1,
										})
									}
									placeholder={aggregations.priceRange.min.toString()}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
								/>
							</div>
							<div>
								<label className="block text-xs text-gray-500 mb-1">Max</label>
								<input
									type="number"
									min={aggregations.priceRange.min}
									max={aggregations.priceRange.max}
									value={filters.maxPrice || ""}
									onChange={(e) =>
										onFilterChange({
											maxPrice: e.target.value
												? parseFloat(e.target.value)
												: undefined,
											page: 1,
										})
									}
									placeholder={aggregations.priceRange.max.toString()}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
								/>
							</div>
						</div>
					</div>
				)}

				{/* Pricing Type Filter */}
				{aggregations?.pricingTypes && aggregations.pricingTypes.length > 0 && (
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-3">
							Pricing Type
						</label>
						<div className="space-y-2">
							{aggregations.pricingTypes.map((pt) => (
								<label
									key={pt.type}
									className="flex items-center gap-2 cursor-pointer"
								>
									<input
										type="radio"
										name="pricingType"
										checked={filters.pricingType === pt.type}
										onChange={() =>
											onFilterChange({
												pricingType: pt.type as SearchFilters["pricingType"],
												page: 1,
											})
										}
										className="w-4 h-4 text-[#63A361]"
									/>
									<span className="text-sm text-gray-700">
										{pt.type.replace("_", " ")} ({pt.count})
									</span>
								</label>
							))}
						</div>
					</div>
				)}

				{/* Feature Filters */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-3">
						Features
					</label>
					<div className="space-y-2">
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.supportsColor || false}
								onChange={(e) =>
									onFilterChange({ supportsColor: e.target.checked, page: 1 })
								}
								className="w-4 h-4 text-[#63A361] rounded"
							/>
							<span className="text-sm text-gray-700">Color Printing</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.supportsFrontBack || false}
								onChange={(e) =>
									onFilterChange({
										supportsFrontBack: e.target.checked,
										page: 1,
									})
								}
								className="w-4 h-4 text-[#63A361] rounded"
							/>
							<span className="text-sm text-gray-700">Front & Back</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.supportsPrintCut || false}
								onChange={(e) =>
									onFilterChange({
										supportsPrintCut: e.target.checked,
										page: 1,
									})
								}
								className="w-4 h-4 text-[#63A361] rounded"
							/>
							<span className="text-sm text-gray-700">Print & Cut</span>
						</label>
						<label className="flex items-center gap-2 cursor-pointer">
							<input
								type="checkbox"
								checked={filters.allowsCustomSize || false}
								onChange={(e) =>
									onFilterChange({
										allowsCustomSize: e.target.checked,
										page: 1,
									})
								}
								className="w-4 h-4 text-[#63A361] rounded"
							/>
							<span className="text-sm text-gray-700">Custom Size</span>
						</label>
					</div>
				</div>
			</div>
		</div>
	);
};


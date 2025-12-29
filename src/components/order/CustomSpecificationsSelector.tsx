import { Plus } from "lucide-react";
import { useState } from "react";
import type { PricingConfig } from "../../services/orderApi";
import { formatPriceModifier } from "../../utils/pricingUtils";

interface CustomSpecificationsSelectorProps {
	pricingConfig: PricingConfig | null;
	selectedCustomSpecs: string[];
	onToggle: (specId: string) => void;
	onAddCustom?: (name: string, priceModifier: number) => void;
}

export const CustomSpecificationsSelector = ({
	pricingConfig,
	selectedCustomSpecs,
	onToggle,
	onAddCustom,
}: CustomSpecificationsSelectorProps) => {
	const [showAddDialog, setShowAddDialog] = useState(false);
	const [newSpecName, setNewSpecName] = useState("");
	const [newSpecPrice, setNewSpecPrice] = useState("");

	const customSpecs = (pricingConfig?.customSpecifications && Array.isArray(pricingConfig.customSpecifications)) ? pricingConfig.customSpecifications : [];

	const handleAddCustom = () => {
		const price = parseFloat(newSpecPrice);
		if (newSpecName.trim() && !isNaN(price) && price >= 0) {
			onAddCustom?.(newSpecName.trim(), price);
			setNewSpecName("");
			setNewSpecPrice("");
			setShowAddDialog(false);
		}
	};

	if (customSpecs.length === 0 && !onAddCustom) {
		return null;
	}

	return (
		<div className="space-y-3 sm:space-y-4">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
				<label className="block text-sm sm:text-base font-medium text-gray-700">
					Add-ons & Extras
				</label>
				{onAddCustom && (
					<button
						type="button"
						onClick={() => setShowAddDialog(true)}
						className="inline-flex items-center gap-1 text-xs sm:text-sm text-[#fbbf24] hover:text-[#d97706] font-medium transition-colors self-start sm:self-auto"
					>
						<Plus className="w-3 h-3 sm:w-4 sm:h-4" />
						<span className="whitespace-nowrap">Add Custom Specification</span>
					</button>
				)}
			</div>

			<div className="space-y-2 sm:space-y-3">
				{customSpecs.map((spec) => {
					const isSelected = selectedCustomSpecs.includes(spec.id);

					return (
						<label
							key={spec.id}
							className={`flex flex-col sm:flex-row sm:items-center p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
								isSelected
									? "border-[#fbbf24] bg-[#fef3c7]"
									: "border-gray-200 hover:border-gray-300"
							}`}
						>
							<div className="flex items-start sm:items-center flex-1">
								<input
									type="checkbox"
									checked={isSelected}
									onChange={() => onToggle(spec.id)}
									className="mt-1 sm:mt-0 mr-3 w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] focus:ring-[#fbbf24] rounded flex-shrink-0"
								/>
								<div className="flex-1 min-w-0">
									<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
										<span className="text-sm sm:text-base font-medium text-gray-900 break-words">
											{spec.name}
										</span>
										<span className="text-xs sm:text-sm font-medium text-[#fbbf24] whitespace-nowrap">
											{formatPriceModifier(
												spec.priceModifier,
												spec.modifierType
											)}
										</span>
									</div>
									{spec.description && (
										<p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-1.5">
											{spec.description}
										</p>
									)}
								</div>
							</div>
						</label>
					);
				})}
			</div>

			{/* Add Custom Specification Dialog */}
			{showAddDialog && onAddCustom && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 sm:p-6">
					<div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full space-y-4 sm:space-y-5 max-h-[90vh] overflow-y-auto">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900">
							Add Custom Specification
						</h3>
						<div>
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
								Specification Name
							</label>
							<input
								type="text"
								value={newSpecName}
								onChange={(e) => setNewSpecName(e.target.value)}
								placeholder="e.g., Lamination, Binding"
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent transition-all"
							/>
						</div>
						<div>
							<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
								Price Modifier
							</label>
							<input
								type="number"
								value={newSpecPrice}
								onChange={(e) => setNewSpecPrice(e.target.value)}
								placeholder="0.00"
								min="0"
								step="0.01"
								className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent transition-all"
							/>
							<p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-1.5">
								Additional cost per unit/page
							</p>
						</div>
						<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2">
							<button
								type="button"
								onClick={handleAddCustom}
								disabled={!newSpecName.trim() || !newSpecPrice}
								className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								Add
							</button>
							<button
								type="button"
								onClick={() => {
									setShowAddDialog(false);
									setNewSpecName("");
									setNewSpecPrice("");
								}}
								className="w-full sm:flex-1 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};


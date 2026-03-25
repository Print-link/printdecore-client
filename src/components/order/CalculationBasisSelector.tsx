import { Calculator } from "@phosphor-icons/react";

interface CalculationBasisSelectorProps {
	calculationBasis: 'INCH' | 'FEET';
	onCalculationBasisChange: (basis: 'INCH' | 'FEET') => void;
	disabled?: boolean;
}

export const CalculationBasisSelector = ({
	calculationBasis,
	onCalculationBasisChange,
	disabled = false,
}: CalculationBasisSelectorProps) => {
	return (
		<div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg p-4">
			<div className="flex items-center gap-2 mb-3">
				<Calculator size={16} weight="duotone" className="text-blue-600" />
				<h3 className="text-sm font-semibold text-blue-900">
					Calculation Basis
				</h3>
			</div>
			<div className="grid grid-cols-2 gap-3">
				<label className="relative flex items-center p-3 bg-white dark:bg-[#1e1e1e] border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50">
					<input
						type="radio"
						name="calculationBasis"
						value="FEET"
						checked={calculationBasis === 'FEET'}
						onChange={() => onCalculationBasisChange('FEET')}
						disabled={disabled}
						className="sr-only"
					/>
					<div className={`w-4 h-4 rounded-full border-2 mr-3 transition-all ${
						calculationBasis === 'FEET' 
							? 'border-blue-600 bg-blue-600' 
							: 'border-gray-300 dark:border-gray-600'
					}`}>
						{calculationBasis === 'FEET' && (
							<div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
						)}
					</div>
					<div className="flex-1">
						<div className="font-medium text-gray-900 dark:text-white">Feet</div>
						<div className="text-xs text-gray-500 dark:text-gray-400">Width × Height × Unit Price</div>
					</div>
				</label>
				<label className="relative flex items-center p-3 bg-white dark:bg-[#1e1e1e] border-2 rounded-lg cursor-pointer transition-all hover:bg-blue-50">
					<input
						type="radio"
						name="calculationBasis"
						value="INCH"
						checked={calculationBasis === 'INCH'}
						onChange={() => onCalculationBasisChange('INCH')}
						disabled={disabled}
						className="sr-only"
					/>
					<div className={`w-4 h-4 rounded-full border-2 mr-3 transition-all ${
						calculationBasis === 'INCH' 
							? 'border-blue-600 bg-blue-600' 
							: 'border-gray-300 dark:border-gray-600'
					}`}>
						{calculationBasis === 'INCH' && (
							<div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
						)}
					</div>
					<div className="flex-1">
						<div className="font-medium text-gray-900 dark:text-white">Inches</div>
						<div className="text-xs text-gray-500 dark:text-gray-400">(Width × Height × Unit Price) ÷ 144</div>
					</div>
				</label>
			</div>
		</div>
	);
};
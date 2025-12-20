import type { MeasurementUnit } from "../../services/orderApi";

interface DimensionsInputProps {
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	onWidthChange: (width: number | undefined) => void;
	onHeightChange: (height: number | undefined) => void;
	onMeasurementUnitChange: (unit: MeasurementUnit) => void;
	required?: boolean;
}

export const DimensionsInput = ({
	width,
	height,
	measurementUnit,
	onWidthChange,
	onHeightChange,
	onMeasurementUnitChange,
	required = false,
}: DimensionsInputProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Width *
				</label>
				<input
					type="number"
					step="0.01"
					min="0"
					value={width || ""}
					onChange={(e) =>
						onWidthChange(parseFloat(e.target.value) || undefined)
					}
					required={required}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Height *
				</label>
				<input
					type="number"
					step="0.01"
					min="0"
					value={height || ""}
					onChange={(e) =>
						onHeightChange(parseFloat(e.target.value) || undefined)
					}
					required={required}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
				/>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 mb-2">
					Unit
				</label>
				<select
					value={measurementUnit}
					onChange={(e) =>
						onMeasurementUnitChange(e.target.value as MeasurementUnit)
					}
					className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
				>
					<option value="FEET">Feet</option>
					<option value="INCH">Inches</option>
					<option value="UNIT">Unit</option>
				</select>
			</div>
		</div>
	);
};


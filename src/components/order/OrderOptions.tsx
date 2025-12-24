import type { AgentService } from "../../services/orderApi";

interface OrderOptionsProps {
	agentService: AgentService;
	options: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
	};
	onOptionChange: (option: "frontBack" | "color" | "printCut" | "frontOnly", value: boolean) => void;
	isPageBased: boolean;
}

export const OrderOptions = ({
	agentService,
	options,
	onOptionChange,
	isPageBased,
}: OrderOptionsProps) => {
	console.log("agentService ------", agentService);
	return (
		<div>
			<label className="block text-sm font-medium text-gray-700 mb-3">
				Options
			</label>
			<div className="space-y-2">
				{agentService.supportsFrontBack && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options.frontBack || false}
							onChange={(e) => {
								onOptionChange("frontBack", e.target.checked);
								onOptionChange("frontOnly", !e.target.checked);
							}}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">
							{isPageBased
								? "Front & Back Printing"
								: "Front & Back Printing (+20%)"}
						</span>
					</label>
				)}
				{agentService.supportsFrontOnly && !options.frontBack && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options.frontOnly || false}
							onChange={(e) => {
								onOptionChange("frontOnly", e.target.checked);
								onOptionChange("frontBack", !e.target.checked);
							}}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">Front Only</span>
					</label>
				)}
				{agentService.supportsColor && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options.color || false}
							onChange={(e) => onOptionChange("color", e.target.checked)}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">
							{isPageBased && agentService.colorPriceModifier
								? `Color Printing (+GHS ${agentService.colorPriceModifier.toFixed(2)} per page)`
								: "Color Printing"}
						</span>
					</label>
				)}
				{agentService.supportsPrintCut && (
					<label className="flex items-center">
						<input
							type="checkbox"
							checked={options.printCut || false}
							onChange={(e) => onOptionChange("printCut", e.target.checked)}
							className="mr-2"
						/>
						<span className="text-sm text-gray-700">Print & Cut (+15%)</span>
					</label>
				)}
			</div>
		</div>
	);
};


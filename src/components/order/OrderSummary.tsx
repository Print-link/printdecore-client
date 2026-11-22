import { UserCircle, Cpu } from "@phosphor-icons/react";

/** Status and date are in the order header at the top, so they aren't repeated here */
interface OrderSummaryProps {
	submittedBy?: string;
	executedByModel?: string;
}

export const OrderSummary = ({ submittedBy, executedByModel }: OrderSummaryProps) => {
	if (!submittedBy && !executedByModel) return null;

	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
			<h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
				Order Summary
			</h3>
			<div className="space-y-4">
				{submittedBy && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5">
							<UserCircle size={14} weight="duotone" />
							Submitted By
						</span>
						<span className="text-sm font-semibold text-gray-900 dark:text-white">
							{submittedBy}
						</span>
					</div>
				)}

				{executedByModel && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5">
							<Cpu size={14} weight="duotone" />
							Model
						</span>
						<span className="text-sm font-semibold text-gray-900 dark:text-white">
							{executedByModel}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

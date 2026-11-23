import { UserCircle, Cpu } from "@phosphor-icons/react";

/** Status and date are in the order header at the top, so they aren't repeated here */
interface OrderSummaryProps {
	submittedBy?: string;
	executedByModel?: string;
}

export const OrderSummary = ({ submittedBy, executedByModel }: OrderSummaryProps) => {
	if (!submittedBy && !executedByModel) return null;

	return (
		<div className="py-5 border-t border-line">
			<h3 className="text-lg font-bold title-tight text-ink mb-4">
				Order Summary
			</h3>
			<div className="space-y-4">
				{submittedBy && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-ink-3 font-medium flex items-center gap-1.5">
							<UserCircle size={14} weight="regular" />
							Submitted By
						</span>
						<span className="text-sm font-semibold text-ink">
							{submittedBy}
						</span>
					</div>
				)}

				{executedByModel && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-ink-3 font-medium flex items-center gap-1.5">
							<Cpu size={14} weight="regular" />
							Model
						</span>
						<span className="text-sm font-semibold text-ink">
							{executedByModel}
						</span>
					</div>
				)}
			</div>
		</div>
	);
};

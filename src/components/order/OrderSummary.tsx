import {
	CalendarBlank,
	UserCircle,
	Cpu,
} from "@phosphor-icons/react";
import { formatDate } from "../../utils/orderUtils";
import { statusStyle } from "../../utils/orderStatus";
import type { OrderStatus } from "../../services/orderApi";

interface OrderSummaryProps {
	status?: string | OrderStatus;
	createdAt?: string;
	submittedBy?: string;
	executedByModel?: string;
}

export const OrderSummary = ({
	status,
	createdAt,
	submittedBy,
	executedByModel,
}: OrderSummaryProps) => {
	const config = statusStyle(status);

	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
			<h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
				Order Summary
			</h3>
			<div className="space-y-4">
				{status && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Status</span>
						<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
							<span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
							{config.label}
						</span>
					</div>
				)}

				{createdAt && (
					<div className="flex items-center justify-between">
						<span className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5">
							<CalendarBlank size={14} weight="duotone" />
							Created
						</span>
						<span className="text-sm font-semibold text-gray-900 dark:text-white">
							{formatDate(createdAt)}
						</span>
					</div>
				)}

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

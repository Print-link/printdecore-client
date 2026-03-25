import {
	CheckCircle,
	CreditCard,
	Package,
	Printer,
	CalendarBlank,
	UserCircle,
	Cpu,
	ClockCountdown,
	CurrencyCircleDollar,
} from "@phosphor-icons/react";
import { formatDate } from "../../utils/orderUtils";
import type { OrderStatus } from "../../services/orderApi";

interface OrderSummaryProps {
	status?: string | OrderStatus;
	createdAt?: string;
	submittedBy?: string;
	executedByModel?: string;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string; icon: React.ReactNode }> = {
	PENDING: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Pending", icon: <ClockCountdown size={16} weight="duotone" /> },
	QUOTED: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", label: "Quoted", icon: <CurrencyCircleDollar size={16} weight="duotone" /> },
	PAID: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Paid", icon: <CreditCard size={16} weight="duotone" /> },
	RECEIVED: { color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500", label: "Received", icon: <Package size={16} weight="duotone" /> },
	IN_PROGRESS: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", label: "In Progress", icon: <Printer size={16} weight="duotone" /> },
	COMPLETED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Completed", icon: <CheckCircle size={16} weight="duotone" /> },
};

export const OrderSummary = ({
	status,
	createdAt,
	submittedBy,
	executedByModel,
}: OrderSummaryProps) => {
	const normalizedStatus = (status || "PENDING").toUpperCase();
	const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;

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

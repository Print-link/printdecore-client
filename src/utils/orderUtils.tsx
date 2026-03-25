import React from "react";
import {
	ClockCountdown,
	CurrencyCircleDollar,
	CheckCircle,
	XCircle,
	Printer,
	Package,
	CreditCard,
} from "@phosphor-icons/react";
import type { OrderStatus } from "../services/orderApi";

export const formatFileSize = (bytes: number): string => {
	if (!bytes || bytes === 0) return "N/A";
	if (bytes < 1024) return bytes + " B";
	if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
	return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

export const formatDate = (timestamp: string): string => {
	const date = new Date(timestamp);
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
};

const statusStyles: Record<string, { bg: string; color: string; border: string; dot: string }> = {
	PENDING: { bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
	QUOTED: { bg: "bg-blue-50", color: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
	PAID: { bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
	RECEIVED: { bg: "bg-cyan-50", color: "text-cyan-700", border: "border-cyan-200", dot: "bg-cyan-500" },
	IN_PROGRESS: { bg: "bg-violet-50", color: "text-violet-700", border: "border-violet-200", dot: "bg-violet-500" },
	COMPLETED: { bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
	// Legacy
	pending: { bg: "bg-amber-50", color: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500" },
	processing: { bg: "bg-blue-50", color: "text-blue-700", border: "border-blue-200", dot: "bg-blue-500" },
	completed: { bg: "bg-emerald-50", color: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
	failed: { bg: "bg-red-50", color: "text-red-700", border: "border-red-200", dot: "bg-red-500" },
};

const statusIcon: Record<string, React.ReactElement> = {
	PENDING: <ClockCountdown size={14} weight="duotone" />,
	QUOTED: <CurrencyCircleDollar size={14} weight="duotone" />,
	PAID: <CreditCard size={14} weight="duotone" />,
	RECEIVED: <Package size={14} weight="duotone" />,
	IN_PROGRESS: <Printer size={14} weight="duotone" />,
	COMPLETED: <CheckCircle size={14} weight="duotone" />,
	// Legacy
	pending: <ClockCountdown size={14} weight="duotone" />,
	processing: <Printer size={14} weight="duotone" />,
	completed: <CheckCircle size={14} weight="duotone" />,
	failed: <XCircle size={14} weight="duotone" />,
};

export const getStatusBadge = (status?: string | OrderStatus): React.ReactElement => {
	const orderStatus = (status || "PENDING").toUpperCase();
	const displayStatus = orderStatus.replace("_", " ");
	const style = statusStyles[orderStatus] || statusStyles.PENDING;
	const icon = statusIcon[orderStatus] || statusIcon.PENDING;

	return (
		<span
			className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.color} ${style.border} border`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
			{icon}
			{displayStatus}
		</span>
	);
};

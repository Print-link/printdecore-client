import React from "react";
import { Clock, Info, CheckCircle, XCircle, Printer } from "lucide-react";
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

export const getStatusBadge = (status?: string | OrderStatus): React.ReactElement => {
	const statusStyles: Record<string, string> = {
		PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
		QUOTED: "bg-blue-50 text-blue-700 border border-blue-200",
		PAID: "bg-green-50 text-green-700 border border-green-200",
		IN_PROGRESS: "bg-orange-50 text-orange-700 border border-orange-200",
		COMPLETED: "bg-[#63A361]/10 text-[#63A361] border border-[#63A361]",
		// Legacy statuses for backward compatibility
		pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
		processing: "bg-blue-50 text-blue-700 border border-blue-200",
		completed: "bg-[#63A361]/10 text-[#63A361] border border-[#63A361]",
		failed: "bg-red-50 text-red-700 border border-red-200",
	};

	const statusIcon: Record<string, React.ReactElement> = {
		PENDING: <Clock className="w-4 h-4" />,
		QUOTED: <Info className="w-4 h-4" />,
		PAID: <CheckCircle className="w-4 h-4" />,
		IN_PROGRESS: <Printer className="w-4 h-4" />,
		COMPLETED: <CheckCircle className="w-4 h-4" />,
		// Legacy
		pending: <Clock className="w-4 h-4" />,
		processing: <Printer className="w-4 h-4" />,
		completed: <CheckCircle className="w-4 h-4" />,
		failed: <XCircle className="w-4 h-4" />,
	};

	const orderStatus = (status || "PENDING").toUpperCase();
	const displayStatus = orderStatus.replace("_", " ");

	return (
		<span
			className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold ${
				statusStyles[orderStatus] || statusStyles.PENDING
			}`}
		>
			{statusIcon[orderStatus] || statusIcon.PENDING}
			{displayStatus}
		</span>
	);
};


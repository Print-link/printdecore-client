import React from "react";
import type { OrderStatus } from "../services/orderApi";
import { statusStyle } from "./orderStatus";

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
	const style = statusStyle(status);
	return (
		<span
			className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${style.bg} ${style.color} ${style.border} border`}
		>
			<span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
			{style.icon(14)}
			{style.label}
		</span>
	);
};

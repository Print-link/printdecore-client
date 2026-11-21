import type { ReactNode } from "react";
import {
	CheckCircle,
	ClockCountdown,
	CreditCard,
	CurrencyCircleDollar,
	MagnifyingGlass,
	Package,
	Printer,
	Storefront,
	Truck,
	XCircle,
} from "@phosphor-icons/react";
import type { OrderStatus } from "../services/orderApi";

/**
 * Every status an order can have, as the customer sees it. The shop moves the
 * order through these from the vendor app; anything missing here used to fall
 * back to "Pending", so the customer never saw "Printing" or "Ready".
 */
export interface StatusStyle {
	label: string;
	color: string;
	bg: string;
	border: string;
	dot: string;
	icon: (size: number) => ReactNode;
}

const amber = { color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500" };
const blue = { color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500" };
const green = { color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" };
const cyan = { color: "text-cyan-700 dark:text-cyan-300", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-500" };
const violet = { color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500" };
const gray = { color: "text-gray-600 dark:text-gray-300", bg: "bg-gray-50 dark:bg-gray-800/40", border: "border-gray-200 dark:border-gray-700", dot: "bg-gray-400" };

const icon = (C: typeof Package) => (size: number) => <C size={size} weight="duotone" />;

export const ORDER_STATUS: Record<OrderStatus, StatusStyle> = {
	PENDING: { ...amber, label: "Pending", icon: icon(ClockCountdown) },
	CONFIRMING_AVAILABILITY: { ...amber, label: "Confirming", icon: icon(ClockCountdown) },
	QUOTED: { ...blue, label: "Quoted", icon: icon(CurrencyCircleDollar) },
	AWAITING_PAYMENT: { ...blue, label: "Awaiting payment", icon: icon(CurrencyCircleDollar) },
	PAID: { ...green, label: "Paid", icon: icon(CreditCard) },
	RECEIVED: { ...violet, label: "In production", icon: icon(Printer) },
	IN_PROGRESS: { ...violet, label: "In progress", icon: icon(Printer) },
	PRINTING: { ...violet, label: "Printing", icon: icon(Printer) },
	QUALITY_CHECK: { ...violet, label: "Quality check", icon: icon(MagnifyingGlass) },
	READY_FOR_PICKUP: { ...cyan, label: "Ready for pickup", icon: icon(Storefront) },
	OUT_FOR_DELIVERY: { ...cyan, label: "Out for delivery", icon: icon(Truck) },
	DELIVERED: { ...green, label: "Delivered", icon: icon(CheckCircle) },
	COMPLETED: { ...green, label: "Completed", icon: icon(CheckCircle) },
	CANCELLED: { ...gray, label: "Cancelled", icon: icon(XCircle) },
};

export const statusStyle = (status?: string): StatusStyle =>
	ORDER_STATUS[(status || "PENDING").toUpperCase() as OrderStatus] ?? ORDER_STATUS.PENDING;

const red = { color: "text-red-700 dark:text-red-300", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-800", dot: "bg-red-500" };

/**
 * How to show an order's status: like statusStyle, except an order the shop
 * turned down reads "Declined", not "Cancelled", so the customer knows why.
 */
export const orderStatusStyle = (order: { status?: string; declineReason?: string }): StatusStyle =>
	order.status?.toUpperCase() === "CANCELLED" && order.declineReason
		? { ...red, label: "Declined by shop", icon: ORDER_STATUS.CANCELLED.icon }
		: statusStyle(order.status);

/** The customer's progress: each step covers the statuses the shop may use within it */
export interface OrderStep {
	key: string;
	label: string;
	statuses: OrderStatus[];
	icon: (size: number) => ReactNode;
}

export const ORDER_STEPS: OrderStep[] = [
	{ key: "placed", label: "Placed", statuses: ["PENDING", "CONFIRMING_AVAILABILITY"], icon: icon(ClockCountdown) },
	{ key: "quoted", label: "Quoted", statuses: ["QUOTED", "AWAITING_PAYMENT"], icon: icon(CurrencyCircleDollar) },
	{ key: "paid", label: "Paid", statuses: ["PAID"], icon: icon(CreditCard) },
	// The shop accepting a paid order starts production; RECEIVED is from before that
	{ key: "production", label: "In production", statuses: ["RECEIVED", "IN_PROGRESS", "PRINTING", "QUALITY_CHECK"], icon: icon(Printer) },
	{ key: "ready", label: "Ready", statuses: ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"], icon: icon(Storefront) },
	{ key: "completed", label: "Completed", statuses: ["DELIVERED", "COMPLETED"], icon: icon(CheckCircle) },
];

/** Where the order is on the steps; -1 when it was cancelled */
export const stepIndex = (status?: string): number => {
	const s = (status || "PENDING").toUpperCase() as OrderStatus;
	return ORDER_STEPS.findIndex((step) => step.statuses.includes(s));
};

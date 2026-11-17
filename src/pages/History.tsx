import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Package,
	CalendarBlank,
	Clock,
	CheckCircle,
	CaretRight,
	WarningCircle,
	Tray,
	Funnel,
	HashStraight,
	Bag,
	Printer,
	CreditCard,
	Truck,
	ClockCountdown,
	CurrencyCircleDollar,
} from "@phosphor-icons/react";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import type { Order, OrderStatus } from "../services/orderApi";

const STATUS_FILTERS: { key: OrderStatus | "all"; label: string; icon: React.ReactNode }[] = [
	{ key: "all", label: "All Orders", icon: <Funnel size={14} weight="duotone" /> },
	{ key: "PENDING", label: "Pending", icon: <ClockCountdown size={14} weight="duotone" /> },
	{ key: "QUOTED", label: "Quoted", icon: <CurrencyCircleDollar size={14} weight="duotone" /> },
	{ key: "PAID", label: "Paid", icon: <CreditCard size={14} weight="duotone" /> },
	{ key: "RECEIVED", label: "Received", icon: <Truck size={14} weight="duotone" /> },
	{ key: "IN_PROGRESS", label: "In Progress", icon: <Printer size={14} weight="duotone" /> },
	{ key: "COMPLETED", label: "Completed", icon: <CheckCircle size={14} weight="duotone" /> },
];

const STATUS_CONFIG: Record<OrderStatus, { color: string; bg: string; border: string; dot: string; label: string }> = {
	PENDING: { color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500", label: "Pending" },
	QUOTED: { color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500", label: "Quoted" },
	PAID: { color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", label: "Paid" },
	RECEIVED: { color: "text-cyan-700", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-500", label: "Received" },
	IN_PROGRESS: { color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500", label: "In Progress" },
	COMPLETED: { color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", label: "Completed" },
	CONFIRMING_AVAILABILITY: { color: "text-amber-700", bg: "bg-amber-50 dark:bg-amber-900/20", border: "border-amber-200 dark:border-amber-800", dot: "bg-amber-500", label: "Confirming" },
	AWAITING_PAYMENT: { color: "text-blue-700", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-800", dot: "bg-blue-500", label: "Awaiting payment" },
	PRINTING: { color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500", label: "Printing" },
	QUALITY_CHECK: { color: "text-violet-700", bg: "bg-violet-50 dark:bg-violet-900/20", border: "border-violet-200 dark:border-violet-800", dot: "bg-violet-500", label: "Quality check" },
	READY_FOR_PICKUP: { color: "text-cyan-700", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-500", label: "Ready for pickup" },
	OUT_FOR_DELIVERY: { color: "text-cyan-700", bg: "bg-cyan-50 dark:bg-cyan-900/20", border: "border-cyan-200 dark:border-cyan-800", dot: "bg-cyan-500", label: "Out for delivery" },
	DELIVERED: { color: "text-emerald-700", bg: "bg-emerald-50 dark:bg-emerald-900/20", border: "border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", label: "Delivered" },
	CANCELLED: { color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-800/40", border: "border-gray-200 dark:border-gray-700", dot: "bg-gray-400", label: "Cancelled" },
};

const ORDER_STEPS: OrderStatus[] = ["PENDING", "QUOTED", "PAID", "RECEIVED", "IN_PROGRESS", "COMPLETED"];

export const History = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<OrderStatus | "all">("all");

	const { data: orders = [], isLoading, error } = useOrders(user?._id);

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStepIndex = (status: OrderStatus) => ORDER_STEPS.indexOf(status);

	const filteredOrders = orders.filter(
		(order: Order) => filter === "all" || order.status === filter
	);

	const orderCounts = orders.reduce((acc: Record<string, number>, order: Order) => {
		acc[order.status] = (acc[order.status] || 0) + 1;
		return acc;
	}, {});

	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Page Header */}
			<div className="mb-6">
				<div className="flex items-center gap-3 mb-1">
					<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#fbbf24] to-[#d97706] flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-amber-900/30">
						<Bag size={20} weight="duotone" className="text-white" />
					</div>
					<div>
						<h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
							Order History
						</h1>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{orders.length} total order{orders.length !== 1 ? "s" : ""}
						</p>
					</div>
				</div>
			</div>

			{/* Filter Pills */}
			<div className="mb-6">
				<div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
					{STATUS_FILTERS.map(({ key, label, icon }) => {
						const isActive = filter === key;
						const count = key === "all" ? orders.length : (orderCounts[key] || 0);
						return (
							<button
								key={key}
								onClick={() => setFilter(key)}
								className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
									isActive
										? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md shadow-gray-900/20 dark:shadow-white/10"
										: "bg-white dark:bg-[#1e1e1e] text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
								}`}
							>
								{icon}
								{label}
								{count > 0 && (
									<span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
										isActive ? "bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
									}`}>
										{count}
									</span>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{/* Error State */}
			{error && (
				<div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-start gap-3">
					<div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
						<WarningCircle size={16} weight="duotone" className="text-red-600" />
					</div>
					<div>
						<p className="text-sm font-semibold text-red-900 dark:text-red-300">
							Failed to load orders
						</p>
						<p className="text-xs mt-0.5 text-red-600 dark:text-red-400">
							{error instanceof Error ? error.message : "Something went wrong. Please try again."}
						</p>
					</div>
				</div>
			)}

			{/* Loading State */}
			{isLoading ? (
				<div className="space-y-4">
					{[1, 2, 3].map((i) => (
						<div key={i} className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
							<div className="flex items-start gap-4">
								<div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl" />
								<div className="flex-1 space-y-3">
									<div className="flex items-center gap-3">
										<div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg" />
										<div className="h-5 w-20 bg-gray-100 dark:bg-gray-800 rounded-full" />
									</div>
									<div className="h-4 w-48 bg-gray-100 dark:bg-gray-800 rounded-lg" />
									<div className="h-1 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
								</div>
							</div>
						</div>
					))}
				</div>
			) : filteredOrders.length === 0 ? (
				/* Empty State */
				<div className="text-center py-16 bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800">
					<div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
						<Tray size={32} weight="duotone" className="text-gray-300 dark:text-gray-600" />
					</div>
					<p className="text-gray-900 dark:text-white text-lg font-semibold mb-1">
						No orders found
					</p>
					<p className="text-gray-400 dark:text-gray-500 text-sm max-w-sm mx-auto">
						{filter === "all"
							? "Your order history will appear here once you place your first order."
							: `No ${filter.replace("_", " ").toLowerCase()} orders at the moment.`}
					</p>
				</div>
			) : (
				/* Order Cards */
				<div className="space-y-3">
					{filteredOrders.map((order: Order) => {
						const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
						const currentStep = getStepIndex(order.status);
						const progress = ((currentStep + 1) / ORDER_STEPS.length) * 100;

						return (
							<button
								key={order.id}
								onClick={() => navigate(`/home/order/${order.id}`)}
								className="w-full group bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5 text-left transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/5 dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-gray-700 active:scale-[0.995]"
							>
								<div className="flex items-start gap-4">
									{/* Order Icon */}
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center shrink-0 border border-gray-100 dark:border-gray-700 group-hover:from-amber-50 group-hover:to-amber-100 dark:group-hover:from-amber-900/20 dark:group-hover:to-amber-800/20 group-hover:border-amber-200 dark:group-hover:border-amber-800 transition-all duration-300">
										<Package size={20} weight="duotone" className="text-gray-400 dark:text-gray-500 group-hover:text-[#d97706] transition-colors duration-300" />
									</div>

									{/* Order Content */}
									<div className="flex-1 min-w-0">
										{/* Top Row: ID + Status */}
										<div className="flex items-center justify-between gap-3 mb-2">
											<div className="flex items-center gap-2.5 min-w-0">
												<div className="flex items-center gap-1.5">
													<HashStraight size={14} weight="bold" className="text-gray-400 dark:text-gray-500" />
													<h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
														{order.id.slice(0, 8).toUpperCase()}
													</h3>
												</div>
												<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color} ${config.border} border`}>
													<span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
													{config.label}
												</span>
											</div>
											<CaretRight size={16} weight="bold" className="text-gray-300 dark:text-gray-600 group-hover:text-[#fbbf24] group-hover:translate-x-0.5 transition-all duration-300 shrink-0" />
										</div>

										{/* Meta Row */}
										<div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
											<span className="flex items-center gap-1.5">
												<CalendarBlank size={14} weight="duotone" />
												{formatDate(order.createdAt)}
											</span>
											<span className="flex items-center gap-1.5">
												<Clock size={14} weight="duotone" />
												{formatTime(order.createdAt)}
											</span>
											{order.items && order.items.length > 0 && (
												<span className="flex items-center gap-1.5">
													<Package size={14} weight="duotone" />
													{order.items.length} item{order.items.length !== 1 ? "s" : ""}
												</span>
											)}
										</div>

										{/* Progress Bar */}
										<div className="mb-3">
											<div className="h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
												<div
													className={`h-full rounded-full transition-all duration-500 ${
														order.status === "COMPLETED"
															? "bg-gradient-to-r from-emerald-400 to-emerald-500"
															: "bg-gradient-to-r from-[#fbbf24] to-[#d97706]"
													}`}
													style={{ width: `${progress}%` }}
												/>
											</div>
										</div>

										{/* Bottom Row: Price */}
										<div className="flex items-center justify-between">
											<span className="text-xs text-gray-400 dark:text-gray-500 font-medium">Total Amount</span>
											<span className="text-base font-bold text-gray-900 dark:text-white">
												GHS {order.totalPrice.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

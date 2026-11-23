import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRight, Tray, WarningCircle } from "@phosphor-icons/react";
import { Button, Chip, EmptyState, RowSkeleton } from "../components/ui";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import type { Order, OrderStatus } from "../services/orderApi";
import { ORDER_STEPS, orderStatusStyle, stepIndex } from "../utils/orderStatus";

/** Filters follow the customer's steps, so "In production" also finds Printing and Quality check */
const STATUS_FILTERS: { key: string; label: string; statuses?: OrderStatus[] }[] = [
	{ key: "all", label: "All" },
	...ORDER_STEPS.map((step) => ({ key: step.key, label: step.label, statuses: step.statuses })),
	{ key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
];


export const History = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [filter, setFilter] = useState("all");
	const activeFilter = STATUS_FILTERS.find((f) => f.key === filter);

	const { data: orders = [], isLoading, error } = useOrders(user?._id);

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const filteredOrders = orders.filter(
		(order: Order) => !activeFilter?.statuses || activeFilter.statuses.includes(order.status)
	);

	const orderCounts = Object.fromEntries(
		STATUS_FILTERS.map((f) => [f.key, f.statuses ? orders.filter((o: Order) => f.statuses!.includes(o.status)).length : orders.length])
	);

	return (
		<div className="w-full max-w-3xl mx-auto">
			{/* Filters */}
			<div className="-mx-4 px-4 sm:mx-0 sm:px-0 mb-4 flex gap-2 overflow-x-auto hide-scrollbar">
				{STATUS_FILTERS.map(({ key, label }) => {
					const count = orderCounts[key] || 0;
					if (key !== "all" && count === 0 && filter !== key) return null;
					return (
						<Chip key={key} active={filter === key} onClick={() => setFilter(key)}>
							{label}
							<span className="num opacity-60">{count}</span>
						</Chip>
					);
				})}
			</div>

			{error && (
				<div className="mb-4 flex items-start gap-3 rounded-xl bg-bad-tint p-3">
					<WarningCircle size={18} className="text-bad shrink-0 mt-0.5" />
					<div>
						<p className="text-sm font-semibold text-bad">Couldn't load your orders</p>
						<p className="text-sm text-ink-2">{error instanceof Error ? error.message : "Something went wrong. Please try again."}</p>
					</div>
				</div>
			)}

			{isLoading ? (
				<RowSkeleton rows={5} thumb={44} />
			) : filteredOrders.length === 0 ? (
				<EmptyState
					icon={<Tray size={26} />}
					title={filter === "all" ? "No orders yet" : `No ${(activeFilter?.label ?? "").toLowerCase()} orders`}
					body={filter === "all" ? "Your orders show up here once you place one." : "Try another filter."}
					action={filter === "all" ? <Button onClick={() => navigate("/home")}>Start an order</Button> : undefined}
				/>
			) : (
				<ul className="border-t border-line">
					{filteredOrders.map((order: Order) => {
						const config = orderStatusStyle(order);
						const step = stepIndex(order.status);
						const items = order.items?.length ?? 0;
						return (
							<li key={order.id}>
								<button onClick={() => navigate(`/home/order/${order.id}`)} className="tap w-full flex items-center gap-3 py-3.5 border-b border-line text-left">
									<span className={`w-11 h-11 shrink-0 rounded-lg flex items-center justify-center ${config.bg} ${config.color}`}>{config.icon(20)}</span>
									<span className="flex-1 min-w-0">
										<span className="flex items-baseline justify-between gap-3">
											<span className="num text-base font-semibold text-ink truncate">#{order.id.slice(0, 8).toUpperCase()}</span>
											<span className="num shrink-0 text-base font-semibold text-ink">GHS {order.totalPrice.toFixed(2)}</span>
										</span>
										<span className="flex items-center justify-between gap-3 mt-0.5">
											<span className={`text-sm font-medium truncate ${config.color}`}>{config.label}</span>
											<span className="num shrink-0 text-xs text-ink-3">
												{formatDate(order.createdAt)} · {formatTime(order.createdAt)}
											</span>
										</span>
										{step >= 0 && (
											<span className="flex gap-1 mt-2" aria-label={`Step ${step + 1} of ${ORDER_STEPS.length}`}>
												{ORDER_STEPS.map((s, i) => (
													<span key={s.key} className={`h-1 flex-1 rounded-full ${i <= step ? config.dot : "bg-fill-press"}`} />
												))}
											</span>
										)}
										{items > 1 && <span className="num block mt-1 text-xs text-ink-3">{items} items</span>}
									</span>
									<CaretRight size={16} className="shrink-0 text-ink-3" />
								</button>
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
};

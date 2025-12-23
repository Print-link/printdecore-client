import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Package,
	Calendar,
	Clock,
	CheckCircle,
	AlertCircle,
	ChevronRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useOrders } from "../hooks/useOrders";
import type { Order, OrderStatus } from "../services/orderApi";

export const History = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [filter, setFilter] = useState<OrderStatus | "all">("all");

	// Use React Query hook for orders with automatic caching and refetching
	const { data: orders = [], isLoading, error } = useOrders(user?._id);

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusIcon = (status: OrderStatus) => {
		switch (status) {
			case "COMPLETED":
				return <CheckCircle className="w-5 h-5 text-[#fbbf24]" />;
			case "PAID":
				return <CheckCircle className="w-5 h-5 text-blue-600" />;
			case "IN_PROGRESS":
				return <Clock className="w-5 h-5 text-yellow-600" />;
			default:
				return <Clock className="w-5 h-5 text-gray-500" />;
		}
	};

	const getStatusBadge = (status: OrderStatus) => {
		const styles: Record<OrderStatus, string> = {
			PENDING: "bg-yellow-50 text-yellow-700 border border-yellow-200",
			QUOTED: "bg-blue-50 text-blue-700 border border-blue-200",
			PAID: "bg-green-50 text-green-700 border border-green-200",
			IN_PROGRESS: "bg-orange-50 text-orange-700 border border-orange-200",
			COMPLETED: "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]",
		};

		return (
			<span
				className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-semibold ${
					styles[status] || "bg-gray-50 text-gray-700 border border-gray-200"
				}`}
			>
				{status.replace("_", " ")}
			</span>
		);
	};

	const filteredOrders = orders.filter(
		(order: Order) => filter === "all" || order.status === filter
	);

	return (
		<div className="w-full max-w-6xl mx-auto">
			<div className="mb-4">
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Order History
				</h1>
				<p className="text-sm text-gray-600">
					View all your orders and their status
				</p>
			</div>

			{/* Filters */}
			<div className="mb-4 flex flex-wrap gap-2">
				<button
					onClick={() => setFilter("all")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "all"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					All
				</button>
				<button
					onClick={() => setFilter("PENDING")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "PENDING"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					Pending
				</button>
				<button
					onClick={() => setFilter("QUOTED")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "QUOTED"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					Quoted
				</button>
				<button
					onClick={() => setFilter("PAID")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "PAID"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					Paid
				</button>
				<button
					onClick={() => setFilter("IN_PROGRESS")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "IN_PROGRESS"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					In Progress
				</button>
				<button
					onClick={() => setFilter("COMPLETED")}
					className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all border-2 ${
						filter === "COMPLETED"
							? "bg-[#fbbf24] text-white border-[#fbbf24]"
							: "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
					}`}
				>
					Completed
				</button>
			</div>

			{error && (
				<div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-start">
					<AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5 text-red-600" />
					<div>
						<p className="text-sm font-semibold text-red-900">
							Error loading orders
						</p>
						<p className="text-xs mt-1 text-red-700">
							{error instanceof Error ? error.message : "Failed to load orders"}
						</p>
					</div>
				</div>
			)}

			{isLoading ? (
				<div className="text-center py-8">
					<div className="w-12 h-12 border-4 border-[#fbbf24] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
					<p className="text-gray-500 text-base font-semibold">
						Loading orders...
					</p>
				</div>
			) : filteredOrders.length === 0 ? (
				<div className="text-center py-8 bg-white rounded-lg border-2 border-gray-200">
					<Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
					<p className="text-gray-500 text-lg font-semibold mb-2">
						No orders found
					</p>
					<p className="text-gray-400 text-sm">
						{filter === "all"
							? "Place your first order to see it here"
							: `No ${filter.replace("_", " ").toLowerCase()} orders found`}
					</p>
				</div>
			) : (
				<div className="space-y-3">
					{filteredOrders.map((order: Order) => (
						<button
							key={order.id}
							onClick={() => navigate(`/order/${order.id}`)}
							className="w-full bg-white rounded-lg border-2 border-gray-200 p-4 text-left hover:border-[#fbbf24] transition-all"
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-start gap-4 flex-1 min-w-0">
									<div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center shrink-0 border-2 border-gray-200">
										<Package className="w-6 h-6 text-[#fbbf24]" />
									</div>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-2 mb-2">
											<h3 className="text-base md:text-lg font-bold text-gray-900">
												Order #{order.id.slice(0, 8)}
											</h3>
											{getStatusBadge(order.status)}
										</div>
										<div className="space-y-1 text-sm text-gray-600 mb-3">
											<div className="flex items-center gap-2">
												<Calendar className="w-4 h-4" />
												<span>{formatDate(order.createdAt)}</span>
											</div>
											{order.items && order.items.length > 0 && (
												<div>
													<span className="font-semibold">
														{order.items.length}
													</span>{" "}
													item{order.items.length !== 1 ? "s" : ""}
												</div>
											)}
										</div>
										<div className="flex items-center justify-between pt-3 border-t-2 border-gray-200">
											<span className="text-sm font-semibold text-gray-700">
												Total
											</span>
											<span className="text-xl font-bold text-[#fbbf24]">
												GHS {order.totalPrice.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
								<div className="flex items-center gap-2 shrink-0">
									{getStatusIcon(order.status)}
									<ChevronRight className="w-5 h-5 text-gray-400" />
								</div>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

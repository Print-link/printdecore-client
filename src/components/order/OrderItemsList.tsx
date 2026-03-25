import { Package } from "@phosphor-icons/react";
import type { OrderItem } from "../../services/orderApi";
import { OrderItemCard } from "./OrderItemCard";

interface OrderItemsListProps {
	items: OrderItem[];
	loading?: boolean;
}

export const OrderItemsList = ({ items, loading }: OrderItemsListProps) => {
	if (loading) {
		return (
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
				<div className="flex items-center gap-3 mb-5">
					<div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
					<div className="h-5 w-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
				</div>
				<div className="space-y-3">
					{[1, 2].map((i) => (
						<div key={i} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
							<div className="flex justify-between mb-3">
								<div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
								<div className="h-5 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
							</div>
							<div className="space-y-2">
								<div className="h-3 w-40 bg-gray-100 dark:bg-gray-800 rounded" />
								<div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
							</div>
						</div>
					))}
				</div>
			</div>
		);
	}

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-2xl border border-gray-100 p-6">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center">
						<Package size={16} weight="duotone" className="text-white" />
					</div>
					<h3 className="text-base font-bold text-gray-900 dark:text-white">
						Order Items
					</h3>
				</div>
				<span className="text-xs font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#161616] px-2.5 py-1 rounded-full">
					{items.length} item{items.length !== 1 ? "s" : ""}
				</span>
			</div>
			<div className="space-y-3">
				{items.map((item, index) => (
					<OrderItemCard key={item.id} item={item} index={index} />
				))}
			</div>
		</div>
	);
};

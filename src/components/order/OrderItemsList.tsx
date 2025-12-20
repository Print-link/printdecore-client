import { Package, Loader2 } from "lucide-react";
import type { OrderItem } from "../../services/orderApi";
import { OrderItemCard } from "./OrderItemCard";

interface OrderItemsListProps {
	items: OrderItem[];
	loading?: boolean;
}

export const OrderItemsList = ({ items, loading }: OrderItemsListProps) => {
	if (loading) {
		return (
			<div className="bg-white rounded-lg border-2 border-gray-200 p-4 text-center">
				<Loader2 className="w-5 h-5 text-[#63A361] animate-spin mx-auto" />
				<p className="text-sm text-gray-600 mt-2">Loading order items...</p>
			</div>
		);
	}

	if (items.length === 0) {
		return null;
	}

	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
				<Package className="w-5 h-5" />
				Order Items ({items.length})
			</h3>
			<div className="space-y-3">
				{items.map((item, index) => (
					<OrderItemCard key={item.id} item={item} index={index} />
				))}
			</div>
		</div>
	);
};


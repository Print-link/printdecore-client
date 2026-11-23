import type { OrderItem } from "../../services/orderApi";
import { OrderItemCard } from "./OrderItemCard";

interface OrderItemsListProps {
	items: OrderItem[];
	loading?: boolean;
}

export const OrderItemsList = ({ items, loading }: OrderItemsListProps) => {
	if (loading) {
		return (
			<div className="py-5 border-t border-line">
				<div className="flex items-center gap-3 mb-5">
					<div className="w-8 h-8 rounded-lg bg-fill animate-pulse" />
					<div className="h-5 w-32 bg-fill rounded-lg animate-pulse" />
				</div>
				<div className="space-y-3">
					{[1, 2].map((i) => (
						<div key={i} className="rounded-xl border border-line p-4 animate-pulse">
							<div className="flex justify-between mb-3">
								<div className="h-4 w-20 bg-fill rounded" />
								<div className="h-5 w-24 bg-fill rounded" />
							</div>
							<div className="space-y-2">
								<div className="h-3 w-40 bg-fill rounded" />
								<div className="h-3 w-28 bg-fill rounded" />
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
		<div className="py-5 border-t border-line">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-3">
					<h3 className="text-lg font-bold title-tight text-ink">
						Order Items
					</h3>
				</div>
				<span className="text-xs font-semibold text-ink-3 bg-fill px-2 h-6 inline-flex items-center rounded-md">
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

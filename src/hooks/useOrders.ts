import { useQuery } from "@tanstack/react-query";
import { getClientOrders, getClientOrderById, getOrderItemsByOrderId, type Order, type OrderItem } from "../services/orderApi";
import type { OrderStatus } from "../services/orderApi";

export const useOrders = (
	clientId?: string,
	branchId?: string,
	status?: OrderStatus
) => {
	return useQuery({
		queryKey: ["orders", clientId, branchId, status],
		queryFn: async () => {
			const response = await getClientOrders(clientId, branchId, status);
			// Handle both old and new response formats
			if (response.success && response.data) {
				// New format: response.data is array of orders
				if (Array.isArray(response.data)) {
					return response.data;
				}
				// Old format: response.data.orders
				const data = response.data as unknown as { orders?: Order[] };
				if (data && typeof data === 'object' && 'orders' in data && Array.isArray(data.orders)) {
					return data.orders;
				}
			}
			return [];
		},
		enabled: !!clientId,
		// The shop moves orders on from the vendor app — keep the list current
		staleTime: 1000 * 15,
		refetchInterval: 1000 * 30,
		refetchOnWindowFocus: true,
	});
};

export const useOrder = (orderId: string | undefined) => {
	return useQuery({
		queryKey: ["order", orderId],
		queryFn: async () => {
			if (!orderId) return null;
			const response = await getClientOrderById(orderId);
			if (response.success && response.data) {
				// Handle both old and new response formats
				const responseData = response.data as Order | { order?: Order };
				const orderData = ('order' in responseData ? responseData.order : responseData) as Order | undefined;
				return orderData || null;
			}
			return null;
		},
		enabled: !!orderId,
		// Status changes come from the shop: refresh while the page is open
		staleTime: 1000 * 10,
		refetchInterval: 1000 * 20,
		refetchOnWindowFocus: true,
	});
};

export const useOrderItems = (orderId: string | undefined) => {
	return useQuery({
		queryKey: ["orderItems", orderId],
		queryFn: async () => {
			if (!orderId) return [];
			const response = await getOrderItemsByOrderId(orderId);
			if (response.success && response.data) {
				const items = Array.isArray(response.data) 
					? response.data 
					: (response.data as { items?: OrderItem[] })?.items || [];
				return items;
			}
			return [];
		},
		enabled: !!orderId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
};


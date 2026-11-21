import { useMemo } from "react";
import { useAuth } from "./useAuth";
import { useOrders } from "./useOrders";
import { money } from "../services/pricingApi";
import type { Order, OrderStatus } from "../services/orderApi";

/** Waiting on the customer: a price to accept and pay */
const TO_PAY: OrderStatus[] = ["QUOTED", "AWAITING_PAYMENT"];
/** Ready for them: collect it, or it's arriving */
const READY: OrderStatus[] = ["READY_FOR_PICKUP", "OUT_FOR_DELIVERY"];
/** Waiting on a shop or the team */
const WAITING: OrderStatus[] = ["PENDING", "CONFIRMING_AVAILABILITY", "PAID"];
/** Being made */
const MAKING: OrderStatus[] = ["RECEIVED", "IN_PROGRESS", "PRINTING", "QUALITY_CHECK"];

const RANK = (s: OrderStatus) => (TO_PAY.includes(s) ? 0 : READY.includes(s) ? 1 : WAITING.includes(s) ? 2 : MAKING.includes(s) ? 3 : 9);

export type ActiveOrder = {
	order: Order;
	/** What's happening, in a few words */
	line: string;
	/** Needs the customer to do something */
	toPay: boolean;
	/** Someone else is on it; the customer just waits */
	waiting: boolean;
	/** Ready to collect, or arriving */
	ready: boolean;
};

const shopOf = (o: Order) => (o as Order & { branch?: { name?: string } }).branch?.name;

const describe = (o: Order): string => {
	const shop = shopOf(o);
	const total = o.totalPrice ? money(o.totalPrice) : "";
	switch (o.status) {
		case "QUOTED":
			return total ? `Price ready: ${total}` : "Your price is ready";
		case "AWAITING_PAYMENT":
			return total ? `Confirmed: pay ${total}` : "Confirmed — pay to start";
		case "PENDING":
			return "Your price is on its way";
		case "CONFIRMING_AVAILABILITY":
			return `${shop ?? "The shop"} is confirming it`;
		case "PAID":
			return o.channel === "marketplace" ? `${shop ?? "The shop"} is accepting it` : "Paid — printing starts soon";
		case "READY_FOR_PICKUP":
			return "Ready for pickup";
		case "OUT_FOR_DELIVERY":
			return "On its way to you";
		default:
			return "Being printed";
	}
};

/**
 * The customer's orders that aren't finished, most urgent first: to pay,
 * ready, waiting, being made. Shares the order list with My orders, so it
 * costs no extra requests and stays current with it.
 */
export const useActiveOrders = () => {
	const { user } = useAuth();
	const { data: orders = [] } = useOrders(user?._id);

	return useMemo(() => {
		const active: ActiveOrder[] = orders
			.filter((o) => RANK(o.status) < 9)
			.sort((a, b) => RANK(a.status) - RANK(b.status) || new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
			.map((order) => ({
				order,
				line: describe(order),
				toPay: TO_PAY.includes(order.status),
				waiting: WAITING.includes(order.status),
				ready: READY.includes(order.status),
			}));
		return { active, count: active.length, toPay: active.filter((a) => a.toPay).length };
	}, [orders]);
};

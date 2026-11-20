import { initializePayment } from "../services/paystackService";

/**
 * Pay for an order on Paystack's page. The server decides the amount and who
 * gets paid from the order itself; coming back lands on /payment/callback,
 * which checks the payment and returns to the order.
 */
export async function payForOrder(order: { id: string; amount: number }, email: string) {
	const response = await initializePayment({
		amount: order.amount,
		email,
		currency: "GHS",
		callback_url: `${window.location.origin}/payment/callback`,
		metadata: { orderId: order.id },
	});
	if (!response.status || !response.data?.authorization_url) throw new Error(response.message || "Couldn't start payment");
	sessionStorage.setItem("payment_return_url", `/home/order/${order.id}`);
	window.location.assign(response.data.authorization_url);
}

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Printer, Storefront, Trash } from "@phosphor-icons/react";
import { ActionBar, BarTotal, Button, EmptyState } from "../components/ui";
import { toast } from "react-toastify";
import { PageHeader } from "../components/common/PageHeader";
import { DeliveryChoice } from "../components/order/DeliveryChoice";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { createMarketplaceOrder } from "../services/marketplaceApi";
import { createProvisionalOrder, deliveryReady, type PricedItemPayload } from "../services/orderApi";
import type { CartItem } from "../contexts/CartContext";
import { money } from "../services/pricingApi";
import { payForOrder } from "../utils/payForOrder";

const itemPayload = (item: CartItem): PricedItemPayload => ({
	measurementUnit: item.measurementUnit,
	quantity: item.quantity,
	choices: item.choices,
	size: item.size,
	pages: item.pages,
	options: item.pages !== undefined || item.files.length ? { filePages: item.pages, files: item.files.length ? item.files : undefined } : undefined,
});

/**
 * The tray: what's been set up, delivery, and placing the order. A shop's
 * order is paid straight away; a Printdecore order is confirmed by the team
 * first, then paid from the order page. Prices are always the server's.
 */
export const Tray = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();
	const { cart, vendor, comment, setComment, delivery, setDelivery, removeFromCart, clearCart, getCartTotal } = useCart();
	const [submitting, setSubmitting] = useState(false);

	// Fill in the phone from the account when it's still blank
	useEffect(() => {
		if (user?.phoneNumber && !delivery?.recipientPhone) setDelivery({ fulfilment: "delivery", ...delivery, recipientPhone: user.phoneNumber });
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [user?.phoneNumber]);

	const ready = cart.length > 0 && deliveryReady(delivery);

	const placeOrder = async () => {
		if (!user) {
			navigate(`/login?returnUrl=${encodeURIComponent("/home/tray")}`);
			return;
		}
		if (!ready || !delivery) return;
		setSubmitting(true);
		try {
			if (vendor) {
				const order = await createMarketplaceOrder({
					branchId: vendor.id,
					comment: comment || undefined,
					delivery,
					items: cart.map((item) => ({ agentServiceId: item.agentServiceId!, ...itemPayload(item) })),
				});
				// The order exists now: the tray is done, and the order page can always finish payment
				clearCart();
				try {
					await payForOrder({ id: order.id, amount: order.totalPrice }, user.email);
				} catch (err) {
					toast.error(`${err instanceof Error ? err.message : "Payment not started"}. You can pay from your order.`);
					navigate(`/home/order/${order.id}`);
				}
				return;
			}
			const order = await createProvisionalOrder({
				clientId: user._id,
				comment: comment || undefined,
				delivery,
				coords: userLocation ?? undefined,
				items: cart.map((item) => ({ serviceTemplateId: item.serviceTemplateId, ...itemPayload(item) })),
			});
			clearCart();
			toast.success("Order sent — we'll confirm it shortly");
			navigate(`/home/order/${order.id}`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't place the order");
		} finally {
			setSubmitting(false);
		}
	};

	if (cart.length === 0) {
		return (
			<EmptyState
				icon={<Printer size={26} />}
				title="Your tray is empty"
				body="Choose a product, set it up, and add it here to order."
				action={<Button onClick={() => navigate("/home")}>Browse products</Button>}
			/>
		);
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader title="Your tray" />

			{/* Who's printing it */}
			<div className="flex items-center gap-3 pb-3 border-b border-line">
				<span className="w-10 h-10 shrink-0 rounded-lg bg-fill text-ink flex items-center justify-center">
					{vendor ? <Storefront size={20} /> : <Printer size={20} />}
				</span>
				<span className="flex-1 min-w-0">
					<span className="block text-base font-semibold text-ink truncate">{vendor ? vendor.name : "Printdecore"}</span>
					<span className="block text-sm text-ink-2 truncate">{vendor ? "Their prices, paid now" : "We find a printer near you"}</span>
				</span>
				<Link to={vendor ? `/home/shops/${vendor.id}` : "/home"} className="tap shrink-0 inline-flex items-center gap-1 h-8 px-3 rounded-lg bg-fill text-sm font-semibold text-ink">
					<Plus size={14} weight="bold" /> Add
				</Link>
			</div>

			<ul className="mb-8">
				{cart.map((item) => (
					<li key={item.id} className="flex gap-3 py-3.5 border-b border-line">
						<div className="flex-1 min-w-0">
							<p className="text-base font-semibold text-ink">{item.serviceName}</p>
							<p className="text-sm text-ink-2 mt-0.5">{item.summaryLines.join(" · ")}</p>
							{item.files.length > 0 && (
								<p className="num text-xs text-ink-3 mt-1">
									{item.files.length} file{item.files.length === 1 ? "" : "s"} attached
								</p>
							)}
						</div>
						<div className="flex flex-col items-end justify-between">
							<p className="num text-base font-semibold text-ink">{money(item.calculatedPrice)}</p>
							<button
								type="button"
								onClick={() => removeFromCart(item.id)}
								className="tap -mr-1.5 p-1.5 rounded-lg text-ink-3 hover:text-bad"
								aria-label={`Remove ${item.serviceName}`}
							>
								<Trash size={16} />
							</button>
						</div>
					</li>
				))}
			</ul>

			<h2 className="mb-3 text-lg font-bold title-tight text-ink">Delivery or pickup</h2>
			<DeliveryChoice delivery={delivery} onChange={setDelivery} />

			<label className="block mt-6">
				<span className="block mb-1.5 text-sm text-ink-2">Note for the printer <span className="text-ink-3">· optional</span></span>
				<textarea
					rows={2}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					className="w-full px-3 py-3 text-base bg-fill border border-transparent rounded-xl text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink resize-none"
				/>
			</label>

			<p className="mt-6 text-sm text-ink-2">
				{vendor
					? "You pay now. The shop then confirms a ready-by time, or you're refunded if they can't take it."
					: "Nothing is charged now. We confirm the price and availability, then you pay from your order."}
			</p>
			{!deliveryReady(delivery) && (
				<p className="mt-2 text-sm text-ink-3">Add your phone number{delivery?.fulfilment !== "pickup" && " and a delivery address"} to continue.</p>
			)}

			<ActionBar>
				<BarTotal value={money(getCartTotal())} />
				<Button onClick={placeOrder} disabled={!ready} loading={submitting}>
					{!user ? "Sign in to order" : vendor ? "Order and pay" : "Send order"}
				</Button>
			</ActionBar>
		</div>
	);
};

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info, Plus, SpinnerGap, Storefront, Trash } from "@phosphor-icons/react";
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
			<div className="max-w-2xl mx-auto">
				<PageHeader title="Your tray" />
				<div className="text-center py-12">
					<p className="font-semibold text-gray-900 dark:text-white">Your tray is empty</p>
					<p className="text-sm text-gray-500 mt-1">Choose a product, set it up, and add it here to order.</p>
					<button type="button" onClick={() => navigate("/home")} className="mt-4 px-4 py-2.5 bg-[#fbbf24] text-black text-sm font-bold rounded-xl">
						Browse products
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader title="Your tray" />

			{vendor ? (
				<div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-sm text-gray-800 dark:text-gray-200">
					<Storefront size={18} className="text-[#d97706]" />
					<span className="flex-1">
						Ordering from <strong>{vendor.name}</strong> at their prices
					</span>
					<Link to={`/home/shops/${vendor.id}`} className="font-semibold text-[#d97706] hover:underline">
						Add more
					</Link>
				</div>
			) : (
				<div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 text-sm text-gray-800 dark:text-gray-200">
					<Info size={18} className="text-[#d97706]" />
					<span className="flex-1">Printdecore finds a printer near you and confirms your order before you pay.</span>
					<Link to="/home" className="flex items-center gap-1 font-semibold text-[#d97706] hover:underline">
						<Plus size={14} /> Add more
					</Link>
				</div>
			)}

			<ul className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-[#1e1e1e] mb-6">
				{cart.map((item) => (
					<li key={item.id} className="flex gap-3 px-4 py-3">
						<div className="flex-1 min-w-0">
							<p className="font-semibold text-gray-900 dark:text-white">{item.serviceName}</p>
							<p className="text-xs text-gray-500 mt-0.5">{item.summaryLines.join(" · ")}</p>
							{item.files.length > 0 && (
								<p className="text-xs text-gray-500 mt-0.5">
									{item.files.length} file{item.files.length === 1 ? "" : "s"} attached
								</p>
							)}
						</div>
						<div className="text-right">
							<p className="font-bold text-gray-900 dark:text-white tabular-nums">{money(item.calculatedPrice)}</p>
							<button
								type="button"
								onClick={() => removeFromCart(item.id)}
								className="mt-1 p-1 text-gray-400 hover:text-red-500"
								aria-label={`Remove ${item.serviceName}`}
							>
								<Trash size={15} />
							</button>
						</div>
					</li>
				))}
			</ul>

			<h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Delivery or pickup</h2>
			<DeliveryChoice delivery={delivery} onChange={setDelivery} />

			<label className="block mt-5">
				<span className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Note for the printer (optional)</span>
				<textarea
					rows={2}
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					className="w-full px-3 py-2.5 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50"
				/>
			</label>

			<div className="mt-6 p-4 rounded-2xl border border-gray-200 dark:border-gray-800">
				<div className="flex justify-between items-baseline">
					<span className="text-sm text-gray-500">Total</span>
					<span className="text-2xl font-black text-gray-900 dark:text-white tabular-nums">{money(getCartTotal())}</span>
				</div>
				<p className="text-xs text-gray-500 mt-1">
					{vendor
						? "You pay now. The shop then confirms a ready-by time, or you're refunded if they can't take it."
						: "Nothing is charged now. We confirm the price and availability, then you pay from your order."}
				</p>
				<button
					type="button"
					onClick={placeOrder}
					disabled={!ready || submitting}
					className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{submitting && <SpinnerGap size={16} className="animate-spin" />}
					{!user ? "Sign in to place your order" : vendor ? "Place order and pay" : "Send order"}
				</button>
				{!deliveryReady(delivery) && <p className="text-xs text-gray-500 mt-2 text-center">Add your phone number{delivery?.fulfilment !== "pickup" && " and a delivery address"} to continue.</p>}
			</div>
		</div>
	);
};

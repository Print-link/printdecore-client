import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, CreditCard, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";
import { getQuotationsForOrder, respondToQuotation } from "../../services/quotationApi";
import { money } from "../../services/pricingApi";
import { payForOrder } from "../../utils/payForOrder";

interface OrderPaymentPanelProps {
	order: {
		id: string;
		status?: string;
		totalPrice?: number;
		channel?: "managed" | "marketplace";
		paymentStatus?: string;
		declineReason?: string;
		refundStatus?: string;
		branch?: { name?: string };
	};
}

const card = "rounded-2xl border p-5 mb-5";

/**
 * What the customer does next with an order: wait while Printdecore confirms
 * it, accept and pay the price it sends, or pay a shop for an order placed
 * with them. Amounts and payees always come from the server.
 */
export const OrderPaymentPanel = ({ order }: OrderPaymentPanelProps) => {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [busy, setBusy] = useState(false);

	const { data: quotations = [] } = useQuery({
		queryKey: ["quotations", order.id],
		queryFn: () => getQuotationsForOrder(order.id),
		enabled: order.status === "QUOTED",
	});
	const pending = quotations.find((q) => q.status === "SENT");

	const pay = async (amount: number) => {
		if (!user?.email) return;
		setBusy(true);
		try {
			await payForOrder({ id: order.id, amount }, user.email);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't start payment");
			setBusy(false);
		}
	};

	const acceptAndPay = async () => {
		if (!pending?.amount) return;
		setBusy(true);
		try {
			await respondToQuotation(pending.id, true);
			await pay(pending.amount);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't accept the price");
			setBusy(false);
		}
	};

	const decline = async () => {
		if (!pending || !window.confirm("Decline this price? The team will be told and can send a new one.")) return;
		setBusy(true);
		try {
			await respondToQuotation(pending.id, false);
			queryClient.invalidateQueries({ queryKey: ["order", order.id] });
			queryClient.invalidateQueries({ queryKey: ["quotations", order.id] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't decline");
		} finally {
			setBusy(false);
		}
	};

	if (order.status === "CONFIRMING_AVAILABILITY") {
		return (
			<div className={`${card} border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-900/10`}>
				<p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<SpinnerGap size={18} className="animate-spin text-[#d97706]" /> Confirming your order
				</p>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
					We're confirming the price and availability. You'll be able to pay here as soon as it's ready — nothing is charged before then.
				</p>
			</div>
		);
	}

	if (order.status === "QUOTED" && pending?.amount) {
		return (
			<div className={`${card} border-[#fbbf24] bg-white dark:bg-[#1e1e1e]`}>
				<p className="text-sm text-gray-500">Your confirmed price</p>
				<p className="text-3xl font-black text-gray-900 dark:text-white">{money(pending.amount)}</p>
				<div className="flex gap-2 mt-4">
					<button
						type="button"
						onClick={acceptAndPay}
						disabled={busy}
						className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50"
					>
						{busy ? <SpinnerGap size={16} className="animate-spin" /> : <CreditCard size={16} />} Accept and pay
					</button>
					<button
						type="button"
						onClick={decline}
						disabled={busy}
						className="px-4 py-3 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
					>
						Decline
					</button>
				</div>
			</div>
		);
	}

	if (order.channel === "marketplace" && order.status === "AWAITING_PAYMENT" && order.totalPrice) {
		return (
			<div className={`${card} border-[#fbbf24] bg-white dark:bg-[#1e1e1e]`}>
				<p className="flex items-center gap-2 text-sm text-gray-500">
					<Clock size={15} /> Waiting for payment{order.branch?.name ? ` to ${order.branch.name}` : ""}
				</p>
				<p className="text-3xl font-black text-gray-900 dark:text-white">{money(order.totalPrice)}</p>
				<button
					type="button"
					onClick={() => pay(order.totalPrice!)}
					disabled={busy}
					className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-bold rounded-xl disabled:opacity-50"
				>
					{busy ? <SpinnerGap size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay now
				</button>
			</div>
		);
	}

	if (order.declineReason) {
		return (
			<div className={`${card} border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10`}>
				<p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<WarningCircle size={18} className="text-red-500" /> The shop couldn't take this order
				</p>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{order.declineReason}</p>
				{order.refundStatus && (
					<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
						Refund: {order.refundStatus === "processed" ? "sent" : order.refundStatus === "failed" ? "we're looking into it" : "on its way"}
					</p>
				)}
			</div>
		);
	}

	return null;
};

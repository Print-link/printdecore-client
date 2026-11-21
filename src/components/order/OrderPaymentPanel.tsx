import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowCounterClockwise, Clock, CreditCard, SpinnerGap, WarningCircle, XCircle } from "@phosphor-icons/react";
import { Link } from "react-router-dom";
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
	// Declining a price: the customer can say why, and the shop sees it
	const [declining, setDeclining] = useState(false);
	const [reason, setReason] = useState("");

	const { data: quotations = [] } = useQuery({
		queryKey: ["quotations", order.id],
		queryFn: () => getQuotationsForOrder(order.id),
		// PENDING too: to tell the customer a price they declined is being redone
		enabled: order.status === "QUOTED" || order.status === "PENDING",
	});
	const latest = quotations[0];
	const who = order.channel === "marketplace" && order.branch?.name ? order.branch.name : order.channel === "marketplace" ? "The shop" : "Our team";
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
		if (!pending) return;
		setBusy(true);
		try {
			await respondToQuotation(pending.id, false, reason);
			setDeclining(false);
			setReason("");
			toast.success(`${who} has been told and can send you a new price`);
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
				{declining ? (
					<div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 p-3">
						<label htmlFor={`decline-${order.id}`} className="text-sm font-semibold text-gray-900 dark:text-white">
							Why are you declining? <span className="font-normal text-gray-500">(optional)</span>
						</label>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{["Too expensive", "I need changes to the job", "It takes too long", "I found another option"].map((r) => (
								<button
									key={r}
									type="button"
									onClick={() => setReason(r)}
									className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
										reason === r
											? "border-[#d97706] bg-amber-50 text-[#b45309] dark:bg-amber-900/20 dark:text-amber-300"
											: "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
									}`}
								>
									{r}
								</button>
							))}
						</div>
						<textarea
							id={`decline-${order.id}`}
							value={reason}
							onChange={(e) => setReason(e.target.value.slice(0, 300))}
							rows={2}
							placeholder="Tell them what would work for you"
							className="mt-2 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#fbbf24]"
						/>
						<p className="mt-1 text-xs text-gray-500">{who === "Our team" ? "We'll" : `${who} will`} see this and can send you a new price.</p>
						<div className="mt-3 flex gap-2">
							<button
								type="button"
								onClick={() => setDeclining(false)}
								disabled={busy}
								className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
							>
								Keep this price
							</button>
							<button
								type="button"
								onClick={decline}
								disabled={busy}
								className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-xl bg-gray-900 text-white dark:bg-white dark:text-black disabled:opacity-50"
							>
								{busy ? <SpinnerGap size={16} className="animate-spin" /> : <XCircle size={16} />} Decline price
							</button>
						</div>
					</div>
				) : (
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
							onClick={() => setDeclining(true)}
							disabled={busy}
							className="px-4 py-3 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
						>
							Decline
						</button>
					</div>
				)}
			</div>
		);
	}

	// A price they declined: waiting for a new one
	if (order.status === "PENDING" && latest?.status === "REJECTED") {
		return (
			<div className={`${card} relative overflow-hidden border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/40`}>
				<span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-gray-400" />
				<p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<ArrowCounterClockwise size={18} className="text-gray-500" /> You declined {latest.amount ? `the price of ${money(latest.amount)}` : "the price"}
				</p>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
					{who} has been told and can send you a new one. We'll notify you when it arrives — nothing is charged until you accept.
				</p>
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
		const unpaid = !order.refundStatus;
		return (
			<div role="status" className={`${card} relative overflow-hidden border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-900/10`}>
				<span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-red-500" />
				<p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
					<WarningCircle size={18} className="text-red-500" /> {who === "Our team" ? "We" : who} couldn't take this order
				</p>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-1">“{order.declineReason}”</p>
				<p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
					{unpaid
						? "Nothing was charged."
						: order.refundStatus === "processed"
							? "Your payment has been refunded in full."
							: order.refundStatus === "failed"
								? "We're refunding your payment — our team will confirm shortly."
								: "Your full refund is on its way."}
				</p>
				<Link
					to="/home"
					className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-[#fbbf24] hover:bg-[#f59e0b] px-4 py-2 text-sm font-bold text-black"
				>
					Order from another shop
				</Link>
			</div>
		);
	}

	return null;
};

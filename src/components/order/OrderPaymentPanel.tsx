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

const card = "rounded-xl p-4 mb-6";

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

	// CONFIRMING_AVAILABILITY: the live tracker on the page already says it is being confirmed

	if (order.status === "QUOTED" && pending?.amount) {
		return (
			<div className={`${card} border border-line-strong bg-surface`}>
				<p className="text-sm text-ink-2">Your confirmed price</p>
				<p className="num text-3xl font-bold title-tight text-ink">{money(pending.amount)}</p>
				{declining ? (
					<div className="mt-4 rounded-xl bg-fill p-3">
						<label htmlFor={`decline-${order.id}`} className="text-sm font-semibold text-ink">
							Why are you declining? <span className="font-normal text-ink-2">(optional)</span>
						</label>
						<div className="mt-2 flex flex-wrap gap-1.5">
							{["Too expensive", "I need changes to the job", "It takes too long", "I found another option"].map((r) => (
								<button
									key={r}
									type="button"
									onClick={() => setReason(r)}
									className={`tap h-8 px-3 rounded-lg text-sm font-medium ${reason === r ? "bg-ink text-page" : "bg-surface text-ink ring-1 ring-inset ring-line"}`}
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
							className="mt-2 w-full rounded-xl border border-transparent bg-surface px-3 py-3 text-base text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink resize-none"
						/>
						<p className="mt-1 text-xs text-ink-2">{who === "Our team" ? "We'll" : `${who} will`} see this and can send you a new price.</p>
						<div className="mt-3 flex gap-2">
							<button
								type="button"
								onClick={() => setDeclining(false)}
								disabled={busy}
								className="tap flex-1 h-10 text-sm font-semibold rounded-xl bg-surface ring-1 ring-inset ring-line text-ink"
							>
								Keep this price
							</button>
							<button
								type="button"
								onClick={decline}
								disabled={busy}
								className="tap flex-1 flex items-center justify-center gap-2 h-10 text-sm font-semibold rounded-xl bg-ink text-page"
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
							className="tap flex-1 flex items-center justify-center gap-2 h-12 bg-brand hover:bg-brand-press text-black text-base font-semibold rounded-xl"
						>
							{busy ? <SpinnerGap size={16} className="animate-spin" /> : <CreditCard size={16} />} Accept and pay
						</button>
						<button
							type="button"
							onClick={() => setDeclining(true)}
							disabled={busy}
							className="tap h-12 px-4 text-base font-semibold rounded-xl bg-fill text-ink"
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
			<div className={`${card} bg-fill`}>
								<p className="flex items-center gap-2 font-bold text-ink">
					<ArrowCounterClockwise size={18} className="text-ink-2" /> You declined {latest.amount ? `the price of ${money(latest.amount)}` : "the price"}
				</p>
				<p className="text-sm text-ink mt-1">
					{who} has been told and can send you a new one. We'll notify you when it arrives — nothing is charged until you accept.
				</p>
			</div>
		);
	}

	if (order.channel === "marketplace" && order.status === "AWAITING_PAYMENT" && order.totalPrice) {
		return (
			<div className={`${card} border border-line-strong bg-surface`}>
				<p className="flex items-center gap-2 text-sm text-ink-2">
					<Clock size={15} /> Waiting for payment{order.branch?.name ? ` to ${order.branch.name}` : ""}
				</p>
				{/* The amount is the order header's Total Amount, right above */}
				<button
					type="button"
					onClick={() => pay(order.totalPrice!)}
					disabled={busy}
					className="tap mt-3 w-full flex items-center justify-center gap-2 h-12 bg-brand hover:bg-brand-press text-black text-base font-semibold rounded-xl"
				>
					{busy ? <SpinnerGap size={16} className="animate-spin" /> : <CreditCard size={16} />} Pay now
				</button>
			</div>
		);
	}

	if (order.declineReason) {
		const unpaid = !order.refundStatus;
		return (
			<div role="status" className={`${card} bg-bad-tint`}>
								<p className="flex items-center gap-2 font-bold text-ink">
					<WarningCircle size={18} className="text-bad" /> {who === "Our team" ? "We" : who} couldn't take this order
				</p>
				<p className="text-sm text-ink mt-1">“{order.declineReason}”</p>
				<p className="text-sm text-ink mt-2">
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
					className="tap mt-3 inline-flex items-center gap-1.5 h-10 rounded-xl bg-brand hover:bg-brand-press px-4 text-sm font-semibold text-black"
				>
					Order from another shop
				</Link>
			</div>
		);
	}

	return null;
};

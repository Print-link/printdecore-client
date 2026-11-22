import { useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PaperPlaneRight, Paperclip, SpinnerGap } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { PageHeader } from "../components/common/PageHeader";
import { ArrivedBanner, QuoteTracker } from "../components/request/QuoteTracker";
import { useArrivalAlert } from "../hooks/useArrivalAlert";
import { useOrder } from "../hooks/useOrders";
import { detailLines, getPrintRequest, getRequestMessages, sendRequestMessage } from "../services/printRequestApi";
import { money } from "../services/pricingApi";

/** Waiting on someone else: a price, or the shop's confirmation */
const WAITING = ["PENDING", "CONFIRMING_AVAILABILITY"];

const STATUS: Record<string, string> = {
	PENDING: "Waiting for a quote",
	CONFIRMING_AVAILABILITY: "Confirming price and availability",
	QUOTED: "Price ready — pay from your order",
	PAID: "Paid",
	RECEIVED: "Received by the printer",
	IN_PROGRESS: "Being printed",
	PRINTING: "Being printed",
	QUALITY_CHECK: "Quality check",
	READY_FOR_PICKUP: "Ready for pickup",
	OUT_FOR_DELIVERY: "Out for delivery",
	DELIVERED: "Delivered",
	COMPLETED: "Completed",
	CANCELLED: "Cancelled",
};

/** One Print Assistant request: what was asked, where it stands, and the conversation with the team */
export const PrintRequestDetails = () => {
	const { id } = useParams<{ id: string }>();
	const queryClient = useQueryClient();
	const [message, setMessage] = useState("");
	const [sending, setSending] = useState(false);
	const messageInput = useRef<HTMLInputElement>(null);

	const { data: request, isLoading, isError, dataUpdatedAt } = useQuery({
		queryKey: ["printRequest", id],
		queryFn: () => getPrintRequest(id!),
		enabled: !!id,
		// While it waits for a price, check often so the news lands the moment it's in
		refetchInterval: (q) => (WAITING.includes(q.state.data?.orderStatus ?? "") ? 10_000 : false),
		refetchOnWindowFocus: true,
	});
	// The shop on it, for an order placed with a shop
	const { data: order } = useOrder(request?.orderId);
	const branch = order as { channel?: string; branch?: { name?: string } } | null | undefined;
	const shopName = branch?.channel === "marketplace" ? branch.branch?.name : undefined;

	const waiting = WAITING.includes(request?.orderStatus ?? "");
	const cancelled = request?.orderStatus === "CANCELLED";
	const arrived = useArrivalAlert(
		// A cancellation isn't news to celebrate
		request ? (waiting ? true : cancelled ? undefined : false) : undefined,
		request?.orderStatus === "QUOTED" ? "Your price is ready — review it and pay" : "Your order is confirmed"
	);
	const { data: messages = [] } = useQuery({
		queryKey: ["printRequestMessages", id],
		queryFn: () => getRequestMessages(id!),
		enabled: !!id,
		refetchInterval: 15000,
	});

	const send = async () => {
		if (!id || !message.trim()) return;
		setSending(true);
		try {
			await sendRequestMessage(id, message.trim());
			setMessage("");
			queryClient.invalidateQueries({ queryKey: ["printRequestMessages", id] });
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Couldn't send");
		} finally {
			setSending(false);
		}
	};

	if (isLoading) return <SpinnerGap size={20} className="animate-spin text-[#fbbf24]" />;
	if (isError || !request) {
		return (
			<div className="max-w-2xl mx-auto">
				<PageHeader title="Request" />
				<p className="text-sm text-gray-500">This request couldn't be found.</p>
			</div>
		);
	}

	const status = request.orderStatus ? STATUS[request.orderStatus] ?? request.orderStatus : undefined;
	const price = request.orderTotalPrice ?? request.calculatedPrice;

	return (
		<div className="w-full max-w-2xl mx-auto">
			<PageHeader title={request.serviceName ?? "Your request"} subtitle={`Request ${request.requestNumber}`} />

			{waiting && (
				<QuoteTracker
					kind={request.orderStatus === "CONFIRMING_AVAILABILITY" ? "confirm" : "quote"}
					createdAt={request.createdAt}
					shopName={shopName}
					lastChecked={dataUpdatedAt}
					onAddDetails={() => {
						messageInput.current?.scrollIntoView({ behavior: "smooth", block: "center" });
						messageInput.current?.focus({ preventScroll: true });
					}}
				/>
			)}
			{arrived && !waiting && (
				<ArrivedBanner
					title={request.orderStatus === "QUOTED" ? "Your price is ready" : "Your order is confirmed"}
					text={
						request.orderStatus === "QUOTED"
							? "Review it and pay to start printing."
							: `${shopName ?? "The shop"} has confirmed it and set a ready-by time.`
					}
					action={
						request.orderId && (
							<Link to={`/home/order/${request.orderId}`} className="inline-flex px-4 py-2.5 rounded-xl bg-[#fbbf24] text-black text-sm font-black">
								{request.orderStatus === "QUOTED" ? "Review price and pay" : "View order"}
							</Link>
						)
					}
				/>
			)}

			<div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1e1e1e] p-5 mb-5">
				{status && !waiting && !arrived && <p className="text-sm font-semibold text-[#d97706]">{status}</p>}
				{/* While waiting, the tracker above already says the price is on its way */}
				{(price || !waiting) && <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{price ? money(price) : "Quote on request"}</p>}
				<dl className="mt-3 first:mt-0 space-y-1 text-sm text-gray-700 dark:text-gray-300">
					{request.quantity !== undefined && (
						<div>
							<dt className="inline text-gray-500">Quantity: </dt>
							<dd className="inline">{request.quantity}</dd>
						</div>
					)}
					{(request.pages ?? request.filePages) !== undefined && (
						<div>
							<dt className="inline text-gray-500">Pages: </dt>
							<dd className="inline">{request.pages ?? request.filePages}</dd>
						</div>
					)}
					<div>
						<dt className="inline text-gray-500">{request.fulfilmentType === "pickup" ? "Pickup" : "Delivery"}: </dt>
						<dd className="inline">{request.fulfilmentType === "pickup" ? "you'll collect it" : request.deliveryAddress}</dd>
					</div>
				</dl>
				{detailLines(request.additionalDetails).length > 0 && (
					<ul className="mt-3 space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
						{detailLines(request.additionalDetails).map((line, i) => (
							<li key={i}>{line}</li>
						))}
					</ul>
				)}
				{request.attachments.length > 0 && (
					<ul className="mt-3 space-y-1">
						{request.attachments.map((f, i) => (
							<li key={f.publicId || i}>
								<a href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-[#d97706] hover:underline">
									<Paperclip size={14} /> {f.name}
								</a>
							</li>
						))}
					</ul>
				)}
				{request.orderId && !(arrived && !waiting) && (
					<Link
						to={`/home/order/${request.orderId}`}
						className="mt-4 inline-block px-4 py-2.5 bg-[#fbbf24] hover:bg-[#f59e0b] text-black text-sm font-bold rounded-xl"
					>
						{request.orderStatus === "QUOTED" ? "Review price and pay" : "View order"}
					</Link>
				)}
			</div>

			<h2 className="text-base font-bold text-gray-900 dark:text-white mb-3">Messages</h2>
			<div className="space-y-2 mb-3">
				{messages.length === 0 && <p className="text-sm text-gray-500">Questions about this job? Message the team here.</p>}
				{messages.map((m) => {
					const mine = m.senderType === "customer";
					const quote = m.cardType === "quote" && m.cardPayload?.amount !== undefined;
					return (
						<div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
							<div
								className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm ${
									mine ? "bg-[#fbbf24] text-black" : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
								}`}
							>
								{quote && <p className="font-bold">Price: {money(m.cardPayload!.amount!)}</p>}
								{m.body && <p className="whitespace-pre-wrap">{m.body}</p>}
								<p className={`text-[10px] mt-1 ${mine ? "text-black/60" : "text-gray-500"}`}>{new Date(m.createdAt).toLocaleString()}</p>
							</div>
						</div>
					);
				})}
			</div>
			<form
				className="flex gap-2"
				onSubmit={(e) => {
					e.preventDefault();
					send();
				}}
			>
				<input
					ref={messageInput}
					value={message}
					onChange={(e) => setMessage(e.target.value)}
					placeholder="Write a message"
					aria-label="Message"
					className="flex-1 px-3 py-2.5 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50"
				/>
				<button
					type="submit"
					disabled={sending || !message.trim()}
					className="px-4 rounded-xl bg-[#fbbf24] text-black disabled:opacity-50"
					aria-label="Send message"
				>
					{sending ? <SpinnerGap size={16} className="animate-spin" /> : <PaperPlaneRight size={16} />}
				</button>
			</form>
		</div>
	);
};

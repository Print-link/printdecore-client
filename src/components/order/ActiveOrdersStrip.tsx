import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRight, CreditCard, HourglassMedium, MapPin, Printer, Truck } from "@phosphor-icons/react";
import { useActiveOrders, type ActiveOrder } from "../../hooks/useActiveOrders";

const since = (at: string, now: number) => {
	const m = Math.max(0, Math.floor((now - new Date(at).getTime()) / 60000));
	if (m < 1) return "just now";
	if (m < 60) return `${m} min ago`;
	const h = Math.floor(m / 60);
	return h < 24 ? `${h} h ago` : `${Math.floor(h / 24)} d ago`;
};

const look = (a: ActiveOrder) => {
	if (a.toPay) return { Icon: CreditCard, ring: "bg-red-500", tile: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400", cta: "Pay" };
	if (a.ready) return { Icon: a.order.status === "OUT_FOR_DELIVERY" ? Truck : MapPin, ring: "bg-emerald-500", tile: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400", cta: "View" };
	if (a.waiting) return { Icon: HourglassMedium, ring: "bg-amber-400", tile: "bg-amber-50 text-[#d97706] dark:bg-amber-400/10 dark:text-amber-300", cta: "Track" };
	return { Icon: Printer, ring: "bg-blue-500", tile: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400", cta: "Track" };
};

/**
 * On Home: the order that matters most right now, one tap away — so a
 * customer who just sent one sees it moving the moment they come back,
 * without digging into My orders.
 */
export const ActiveOrdersStrip = () => {
	const navigate = useNavigate();
	const { active } = useActiveOrders();
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = window.setInterval(() => setNow(Date.now()), 30000);
		return () => window.clearInterval(id);
	}, []);

	if (!active.length) return null;
	const top = active[0];
	const { Icon, ring, tile, cta } = look(top);
	const more = active.length - 1;

	return (
		<section className="chat-in mb-5" aria-label="Your active orders">
			<button
				type="button"
				onClick={() => navigate(`/home/order/${top.order.id}`)}
				className={`tap w-full flex items-center gap-3 rounded-2xl border bg-white dark:bg-[#1a1a1a] p-3 pr-3.5 text-left shadow-sm hover:shadow-md transition-shadow ${
					top.toPay ? "border-red-200 dark:border-red-500/30" : "border-gray-200 dark:border-gray-800"
				}`}
			>
				<span className={`relative w-11 h-11 shrink-0 rounded-xl flex items-center justify-center ${tile}`}>
					<Icon size={22} weight="duotone" />
					<span className="absolute -top-1 -right-1 flex w-3 h-3">
						<span className={`absolute inset-0 rounded-full ${ring} animate-ping opacity-60`} />
						<span className={`relative w-3 h-3 rounded-full ${ring} ring-2 ring-white dark:ring-[#1a1a1a]`} />
					</span>
				</span>
				<span className="flex-1 min-w-0">
					<span className="block text-[11px] font-bold uppercase tracking-wider text-gray-400">
						{top.toPay ? "Needs you" : top.ready ? "Ready" : "In progress"} · #{top.order.id.slice(0, 8).toUpperCase()}
					</span>
					<span className="block truncate text-sm font-bold text-gray-900 dark:text-white">{top.line}</span>
					<span className="block text-xs text-gray-500 dark:text-gray-400">Placed {since(top.order.createdAt, now)}</span>
				</span>
				<span
					className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-black ${
						top.toPay ? "bg-red-500 text-white" : "bg-gray-900 text-white dark:bg-white dark:text-black"
					}`}
				>
					{cta} <CaretRight size={12} weight="bold" />
				</span>
			</button>
			{more > 0 && (
				<button
					type="button"
					onClick={() => navigate("/home/history")}
					className="mt-1.5 ml-1 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-[#d97706]"
				>
					+ {more} more active order{more === 1 ? "" : "s"} in My orders →
				</button>
			)}
		</section>
	);
};

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
	if (a.toPay) return { Icon: CreditCard, dot: "bg-bad", label: "Needs you", cta: "Pay" };
	if (a.ready) return { Icon: a.order.status === "OUT_FOR_DELIVERY" ? Truck : MapPin, dot: "bg-ok", label: "Ready", cta: "View" };
	if (a.waiting) return { Icon: HourglassMedium, dot: "bg-brand", label: "In progress", cta: "Track" };
	return { Icon: Printer, dot: "bg-brand", label: "In progress", cta: "Track" };
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
	const { Icon, dot, label, cta } = look(top);
	const more = active.length - 1;

	return (
		<section className="mb-5 rounded-xl border border-line bg-surface" aria-label="Your active orders">
			<button type="button" onClick={() => navigate(`/home/order/${top.order.id}`)} className="tap w-full flex items-center gap-3 p-3 text-left">
				<span className="relative w-11 h-11 shrink-0 rounded-lg bg-fill text-ink flex items-center justify-center">
					<Icon size={22} />
					<span className={`absolute top-1 right-1 w-2 h-2 rounded-full ${dot}`} />
				</span>
				<span className="flex-1 min-w-0">
					<span className="block truncate text-xs text-ink-2">
						<span className={`font-semibold ${top.toPay ? "text-bad" : "text-ink"}`}>{label}</span> · <span className="num">#{top.order.id.slice(0, 8).toUpperCase()}</span>
					</span>
					<span className="block truncate text-base font-semibold text-ink">{top.line}</span>
					<span className="block text-xs text-ink-3">Placed {since(top.order.createdAt, now)}</span>
				</span>
				<span className={`shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-lg text-sm font-semibold ${top.toPay ? "bg-bad text-white" : "bg-fill text-ink"}`}>
					{cta} <CaretRight size={12} weight="bold" />
				</span>
			</button>
			{more > 0 && (
				<button type="button" onClick={() => navigate("/home/history")} className="tap w-full flex items-center justify-between px-3 h-10 border-t border-line text-sm text-ink-2">
					<span className="num">{more} more active order{more === 1 ? "" : "s"}</span>
					<CaretRight size={14} className="text-ink-3" />
				</button>
			)}
		</section>
	);
};

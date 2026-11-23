import { MapPin, ChatDots, CheckCircle } from "@phosphor-icons/react";
import { Button } from "../ui";
import { formatDate } from "../../utils/orderUtils";
import { ORDER_STEPS, orderStatusStyle, statusNote, stepIndex, stepLabel } from "../../utils/orderStatus";
import type { OrderStatus } from "../../services/orderApi";

interface OrderHeaderProps {
	status?: string | OrderStatus;
	/** Set when the shop declined the order — shown as "Declined by shop" */
	declineReason?: string;
	/** For step names and the note: collected vs delivered */
	fulfilmentType?: "delivery" | "pickup";
	/** The shop's ready-by time, once they've accepted */
	readyBy?: string;
	/** The shop making it, for an order placed with a shop */
	shopName?: string;
	totalPrice?: number;
	createdAt?: string;
	hasLocation: boolean;
	onGetDirections: () => void;
	onReportIssue: () => void;
	/** The live tracker below already says where it is */
	hideNote?: boolean;
}

export const OrderHeader = ({
	status,
	declineReason,
	fulfilmentType,
	readyBy,
	shopName,
	totalPrice,
	createdAt,
	hasLocation,
	onGetDirections,
	onReportIssue,
	hideNote,
}: OrderHeaderProps) => {
	const config = orderStatusStyle({ status, declineReason });
	const currentStepIndex = stepIndex(status);
	const note = declineReason || hideNote ? null : statusNote({ status, fulfilmentType, readyBy, shopName });

	const current = ORDER_STEPS[currentStepIndex];

	return (
		<div className="mb-6">
			<div className="flex items-center gap-2 text-sm">
				<span className={`inline-flex items-center gap-1.5 h-6 px-2 rounded-md font-semibold ${config.bg} ${config.color}`}>
					<span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
					{config.label}
				</span>
				{createdAt && <span className="num text-ink-3 truncate">{formatDate(createdAt)}</span>}
			</div>
			{totalPrice !== undefined && <p className="num mt-2 text-3xl font-bold title-tight text-ink">GHS {totalPrice.toFixed(2)}</p>}

			{/* Progress: one bar per step, the current one named */}
			{currentStepIndex >= 0 && (
				<div className="mt-5">
					<div className="flex gap-1" aria-hidden>
						{ORDER_STEPS.map((step, i) => (
							<span key={step.key} className={`h-1 flex-1 rounded-full ${i <= currentStepIndex ? config.dot : "bg-fill-press"}`} />
						))}
					</div>
					<div className="mt-2 flex items-center justify-between text-xs">
						<span className="font-semibold text-ink">{current ? stepLabel(current, fulfilmentType) : ""}</span>
						<span className="num text-ink-3">
							Step {currentStepIndex + 1} of {ORDER_STEPS.length}
						</span>
					</div>
					{/* All steps, from tablet up */}
					<ol className="hidden md:flex mt-3 justify-between text-xs">
						{ORDER_STEPS.map((step, i) => (
							<li key={step.key} className={`flex items-center gap-1 ${i <= currentStepIndex ? "text-ink" : "text-ink-3"}`}>
								{i < currentStepIndex ? <CheckCircle size={14} weight="fill" className="text-ok" /> : step.icon(14)}
								{stepLabel(step, fulfilmentType)}
							</li>
						))}
					</ol>
				</div>
			)}

			{/* Where it is now, in words — the same as their notification said */}
			{note && (
				<div role="status" className="mt-5 flex items-start gap-3 rounded-xl bg-fill p-3">
					<span className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon(18)}</span>
					<div className="min-w-0">
						<p className="text-sm font-semibold text-ink">{note.title}</p>
						<p className="text-sm text-ink-2">{note.body}</p>
					</div>
				</div>
			)}

			<div className="mt-4 flex gap-2">
				{hasLocation && (
					<Button variant="secondary" size="md" onClick={onGetDirections} icon={<MapPin size={16} />}>
						Directions
					</Button>
				)}
				<Button variant="secondary" size="md" onClick={onReportIssue} icon={<ChatDots size={16} />}>
					Report an issue
				</Button>
			</div>
		</div>
	);
};

import { MapPin, ArrowSquareOut, ChatDots, CheckCircle } from "@phosphor-icons/react";
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

	return (
		<div className="mb-6">
			{/* Main Header Card */}
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
					{/* Left: Status & Price */}
					<div className="flex-1">
						<div className="flex flex-wrap items-center gap-3 mb-4">
							<span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${config.bg} ${config.color} ${config.border} border`}>
								<span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
								{config.label}
							</span>
							{createdAt && (
								<span className="text-sm text-gray-400 dark:text-gray-500 font-medium">
									{formatDate(createdAt)}
								</span>
							)}
						</div>
						{totalPrice !== undefined && (
							<div>
								<p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-1">Total Amount</p>
								<p className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
									GHS {totalPrice.toFixed(2)}
								</p>
							</div>
						)}
					</div>

					{/* Right: Actions */}
					<div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
						{hasLocation && (
							<button
								onClick={onGetDirections}
								className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-semibold shadow-sm"
							>
								<MapPin size={16} weight="duotone" />
								Get Directions
								<ArrowSquareOut size={12} weight="bold" className="opacity-60" />
							</button>
						)}
						<button
							onClick={onReportIssue}
							className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white dark:bg-[#1e1e1e] text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 text-sm font-semibold border border-gray-200 dark:border-gray-700"
						>
							<ChatDots size={16} weight="duotone" />
							Report Issue
						</button>
					</div>
				</div>
			</div>

			{/* Progress Stepper */}
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 px-3 sm:px-6 py-4">
				<div className="flex items-center justify-between">
					{ORDER_STEPS.map((step, index) => {
						const isCompleted = index <= currentStepIndex;
						const isCurrent = index === currentStepIndex;
						const isLast = index === ORDER_STEPS.length - 1;

						return (
							<div key={step.key} className="flex items-center flex-1 min-w-0 last:flex-none">
								<div className="flex flex-col items-center">
									<div
										className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 ${
											isCurrent
												? `${config.bg} ${config.color} ${config.border} border-2 shadow-sm`
												: isCompleted
												? "bg-emerald-500 text-white"
												: "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
										}`}
									>
										{isCompleted && !isCurrent ? (
											<CheckCircle size={14} weight="fill" />
										) : (
											<span className="text-xs font-bold">{step.icon(14)}</span>
										)}
									</div>
									<span className={`text-[10px] mt-1.5 font-medium hidden md:block whitespace-nowrap ${
										isCurrent ? "text-gray-900 dark:text-white" : isCompleted ? "text-emerald-600" : "text-gray-400 dark:text-gray-500"
									}`}>
										{stepLabel(step, fulfilmentType)}
									</span>
								</div>
								{!isLast && (
									<div className={`flex-1 min-w-[6px] h-0.5 mx-1 sm:mx-2 rounded-full transition-all duration-300 ${
										index < currentStepIndex ? "bg-emerald-400" : "bg-gray-100 dark:bg-gray-800"
									}`} />
								)}
							</div>
						);
					})}
				</div>
				{/* Where it is now, in words — the same as their notification said */}
				{note && (
					<div role="status" className={`mt-4 flex items-start gap-3 rounded-xl border px-4 py-3 ${config.bg} ${config.border}`}>
						<span className={`mt-0.5 shrink-0 ${config.color}`}>{config.icon(18)}</span>
						<div className="min-w-0">
							<p className="text-sm font-bold text-gray-900 dark:text-white">{note.title}</p>
							<p className="text-sm text-gray-700 dark:text-gray-300">{note.body}</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

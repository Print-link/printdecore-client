import {
	MapPin,
	ArrowSquareOut,
	ChatDots,
	CheckCircle,
	CreditCard,
	Package,
	Printer,
	ClockCountdown,
	CurrencyCircleDollar,
} from "@phosphor-icons/react";
import { formatDate } from "../../utils/orderUtils";
import type { OrderStatus } from "../../services/orderApi";

interface OrderHeaderProps {
	status?: string | OrderStatus;
	totalPrice?: number;
	createdAt?: string;
	hasLocation: boolean;
	onGetDirections: () => void;
	onReportIssue: () => void;
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; dot: string; label: string; icon: React.ReactNode }> = {
	PENDING: { color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500", label: "Pending", icon: <ClockCountdown size={16} weight="duotone" /> },
	QUOTED: { color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500", label: "Quoted", icon: <CurrencyCircleDollar size={16} weight="duotone" /> },
	PAID: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Paid", icon: <CreditCard size={16} weight="duotone" /> },
	RECEIVED: { color: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200", dot: "bg-cyan-500", label: "Received", icon: <Package size={16} weight="duotone" /> },
	IN_PROGRESS: { color: "text-violet-700", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500", label: "In Progress", icon: <Printer size={16} weight="duotone" /> },
	COMPLETED: { color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500", label: "Completed", icon: <CheckCircle size={16} weight="duotone" /> },
};

const ORDER_STEPS: { key: string; label: string }[] = [
	{ key: "PENDING", label: "Pending" },
	{ key: "QUOTED", label: "Quoted" },
	{ key: "PAID", label: "Paid" },
	{ key: "RECEIVED", label: "Received" },
	{ key: "IN_PROGRESS", label: "In Progress" },
	{ key: "COMPLETED", label: "Completed" },
];

export const OrderHeader = ({
	status,
	totalPrice,
	createdAt,
	hasLocation,
	onGetDirections,
	onReportIssue,
}: OrderHeaderProps) => {
	const normalizedStatus = (status || "PENDING").toUpperCase();
	const config = STATUS_CONFIG[normalizedStatus] || STATUS_CONFIG.PENDING;
	const currentStepIndex = ORDER_STEPS.findIndex((s) => s.key === normalizedStatus);

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
			<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 px-6 py-4">
				<div className="flex items-center justify-between">
					{ORDER_STEPS.map((step, index) => {
						const isCompleted = index <= currentStepIndex;
						const isCurrent = index === currentStepIndex;
						const isLast = index === ORDER_STEPS.length - 1;
						const stepConfig = STATUS_CONFIG[step.key];

						return (
							<div key={step.key} className="flex items-center flex-1 last:flex-none">
								<div className="flex flex-col items-center">
									<div
										className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
											isCurrent
												? `${config.bg} ${config.color} ${config.border} border-2 shadow-sm`
												: isCompleted
												? "bg-emerald-500 text-white"
												: "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500"
										}`}
									>
										{isCompleted && !isCurrent ? (
											<CheckCircle size={16} weight="fill" />
										) : (
											<span className="text-xs font-bold">{stepConfig?.icon || (index + 1)}</span>
										)}
									</div>
									<span className={`text-[10px] mt-1.5 font-medium hidden sm:block ${
										isCurrent ? "text-gray-900 dark:text-white" : isCompleted ? "text-emerald-600" : "text-gray-400 dark:text-gray-500"
									}`}>
										{step.label}
									</span>
								</div>
								{!isLast && (
									<div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-300 ${
										index < currentStepIndex ? "bg-emerald-400" : "bg-gray-100 dark:bg-gray-800"
									}`} />
								)}
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

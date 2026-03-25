import { Clock, CheckCircle, XCircle } from "@phosphor-icons/react";
import { isStationOpen, formatWorkingHours, getNextOpenTime, type WorkingHour } from "../utils/workingHours";

interface StationStatusBadgeProps {
	workingHours?: WorkingHour[];
	isOpen?: boolean | null; // Optional backend-calculated status
	compact?: boolean;
}

export const StationStatusBadge = ({
	workingHours,
	isOpen: backendIsOpen,
	compact = false,
}: StationStatusBadgeProps) => {
	// Use backend's isOpen if provided, otherwise calculate client-side
	const isOpen = backendIsOpen !== undefined 
		? backendIsOpen 
		: isStationOpen(workingHours);
	const hoursText = formatWorkingHours(workingHours);
	const nextOpenTime = getNextOpenTime(workingHours);

	const isOpenStatus = isOpen === true;
	const isClosedStatus = isOpen === false;

	if (compact) {
		return (
			<div
				className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
					isOpenStatus
						? "bg-green-100 text-green-700"
						: isClosedStatus
						? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
						: "bg-amber-100 text-amber-700"
				}`}
			>
				{isOpenStatus ? (
					<CheckCircle size={12} weight="regular" />
				) : isClosedStatus ? (
					<XCircle size={12} weight="regular" />
				) : (
					<Clock size={12} weight="regular" />
				)}
				<span>
					{isOpenStatus
						? "Open"
						: isClosedStatus
						? "Closed"
						: "Unknown"}
				</span>
			</div>
		);
	}

	return (
		<div className="space-y-1">
			<div
				className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
					isOpenStatus
						? "bg-green-100 text-green-700"
						: isClosedStatus
						? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
						: "bg-amber-100 text-amber-700"
				}`}
			>
				{isOpenStatus ? (
					<CheckCircle size={14} weight="regular" />
				) : isClosedStatus ? (
					<XCircle size={14} weight="regular" />
				) : (
					<Clock size={14} weight="regular" />
				)}
				<span>
					{isOpenStatus
						? "Open"
						: isClosedStatus
						? "Closed"
						: "Hours unavailable"}
				</span>
			</div>
			<div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
				<Clock size={12} weight="regular" />
				<span className={isClosedStatus && nextOpenTime ? "font-bold" : ""}>
					{isOpenStatus
						? hoursText
						: isClosedStatus
						? nextOpenTime || hoursText
						: hoursText}
				</span>
			</div>
		</div>
	);
};


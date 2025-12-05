import { Clock, CheckCircle, XCircle } from "lucide-react";
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
						? "bg-gray-100 text-gray-600"
						: "bg-amber-100 text-amber-700"
				}`}
			>
				{isOpenStatus ? (
					<CheckCircle className="w-3 h-3" />
				) : isClosedStatus ? (
					<XCircle className="w-3 h-3" />
				) : (
					<Clock className="w-3 h-3" />
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
						? "bg-gray-100 text-gray-600"
						: "bg-amber-100 text-amber-700"
				}`}
			>
				{isOpenStatus ? (
					<CheckCircle className="w-3.5 h-3.5" />
				) : isClosedStatus ? (
					<XCircle className="w-3.5 h-3.5" />
				) : (
					<Clock className="w-3.5 h-3.5" />
				)}
				<span>
					{isOpenStatus
						? "Open"
						: isClosedStatus
						? "Closed"
						: "Hours unavailable"}
				</span>
			</div>
			<div className="flex items-center gap-1 text-xs text-gray-600">
				<Clock className="w-3 h-3" />
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


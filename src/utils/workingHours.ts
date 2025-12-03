export interface WorkingHour {
	day: string;
	isOpen: boolean;
	openTime?: string;
	closeTime?: string;
}

export const isStationOpen = (workingHours?: WorkingHour[]): boolean | null => {
	if (!workingHours || workingHours.length === 0) {
		return null;
	}

	const now = new Date();
	const dayNames = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];
	const currentDayIndex = now.getDay();
	const currentDay = dayNames[currentDayIndex];
	const currentTime = now.toTimeString().slice(0, 5);

	const todaySchedule = workingHours.find(
		(wh) => wh.day.toLowerCase() === currentDay
	);

	if (!todaySchedule) {
		return false;
	}

	if (!todaySchedule.isOpen) {
		return false;
	}

	if (!todaySchedule.openTime || !todaySchedule.closeTime) {
		return true;
	}

	return currentTime >= todaySchedule.openTime && currentTime <= todaySchedule.closeTime;
};

export const formatWorkingHours = (workingHours?: WorkingHour[]): string => {
	if (!workingHours || workingHours.length === 0) {
		return "Hours not available";
	}

	const now = new Date();
	const dayNames = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];
	const currentDayIndex = now.getDay();
	const currentDay = dayNames[currentDayIndex];
	const todaySchedule = workingHours.find(
		(wh) => wh.day.toLowerCase() === currentDay
	);

	if (!todaySchedule) {
		return "Closed today";
	}

	if (!todaySchedule.isOpen) {
		return "Closed today";
	}

	if (!todaySchedule.openTime || !todaySchedule.closeTime) {
		return "Open all day";
	}

	return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
};

export const getNextOpenTime = (workingHours?: WorkingHour[]): string | null => {
	if (!workingHours || workingHours.length === 0) {
		return null;
	}

	const now = new Date();
	const dayNames = [
		"sunday",
		"monday",
		"tuesday",
		"wednesday",
		"thursday",
		"friday",
		"saturday",
	];
	const currentDayIndex = now.getDay();
	const currentTime = now.toTimeString().slice(0, 5);

	for (let i = 0; i < 7; i++) {
		const dayIndex = (currentDayIndex + i) % 7;
		const day = dayNames[dayIndex];
		const schedule = workingHours.find(
			(wh) => wh.day.toLowerCase() === day
		);

		if (schedule && schedule.isOpen && schedule.openTime) {
			if (i === 0) {
				if (currentTime < schedule.openTime) {
					return `Opens today at ${schedule.openTime}`;
				}
			} else {
				const dayName = day.charAt(0).toUpperCase() + day.slice(1);
				return `Opens ${dayName} at ${schedule.openTime}`;
			}
		}
	}

	return null;
};


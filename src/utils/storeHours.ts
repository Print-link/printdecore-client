import type { OperatingHours } from "../services/marketplaceApi";

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
export const DAY_LABELS: Record<(typeof DAYS)[number], string> = {
	sunday: "Sunday",
	monday: "Monday",
	tuesday: "Tuesday",
	wednesday: "Wednesday",
	thursday: "Thursday",
	friday: "Friday",
	saturday: "Saturday",
};

const clock = (time: string): string => {
	const [h, m] = time.split(":").map(Number);
	const period = h >= 12 ? "PM" : "AM";
	const h12 = h % 12 || 12;
	return m ? `${h12}:${String(m).padStart(2, "0")} ${period}` : `${h12} ${period}`;
};

export const formatHours = (h: { open: string; close: string }) => `${clock(h.open)} – ${clock(h.close)}`;

/** Days starting today, so "today" is always first in the hours list. */
export const daysFromToday = () => {
	const today = new Date().getDay();
	return DAYS.map((_, i) => DAYS[(today + i) % 7]);
};

/** "Open · closes 6 PM" / "Closed · opens 8 AM" — null when hours aren't set. */
export function openLabel(hours: OperatingHours | undefined, isOpenNow: boolean | null): string | null {
	if (isOpenNow === null || !hours) return null;
	const today = hours[DAYS[new Date().getDay()]];
	if (!today) return "Closed today";
	return isOpenNow ? `Open · closes ${clock(today.close)}` : `Closed · opens ${clock(today.open)}`;
}

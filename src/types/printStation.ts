import type { WorkingHour } from "../utils/workingHours";

export interface PrintStation {
	_id: string;
	id?: string;
	name: string;
	email: string;
	businessName?: string;
	businessPhone?: string;
	businessCoverImage?: string;
	paystackSubaccountCode?: string;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
	};
	workingHours?: WorkingHour[];
	isOpen?: boolean | null; // Backend-calculated open status (true = open, false = closed, null = unknown)
	distance?: number;
	profile?: {
		id: string;
		email: string;
		name: string;
	};
	averageRating?: number;
	createdAt?: string;
	updatedAt?: string;
}

export interface UserLocation {
	latitude: number;
	longitude: number;
}

export type LocationPermission = "prompt" | "granted" | "denied";


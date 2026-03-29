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
	totalRatings?: number;
	createdAt?: string;
	updatedAt?: string;
	agentServices?: Array<{
		id: string;
		serviceTemplateId: string;
		serviceName: string;
		categoryName?: string;
		pricePerUnit?: number;
		formulaType?: string;
		isActive: boolean;
		hasFlexiblePricing?: boolean;
	}>;
	totalServicesCount?: number; // Total count of services (may be more than displayed)
	activeDiscount?: {
		code: string;
		name: string;
		discountType: 'percentage' | 'fixed';
		discountValue: number;
		currency?: string;
	};
	performanceTier?: '2x' | '3x' | '4x' | '5x' | 'diamond';
}

export interface UserLocation {
	latitude: number;
	longitude: number;
}

export type LocationPermission = "prompt" | "granted" | "denied";


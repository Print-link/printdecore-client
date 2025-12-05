export type CategoryType =
	| "wassce_result"
	| "bece_result"
	| "novdec_result"
	| "large_format"
	| "regular_format"
	| null
	| undefined;

export type RegularFormatProperties = "front_only" | "front_and_back";

export interface Category {
	_id: string;
	id: string;
	name: string;
	unitPrice: number;
	description: string;
	adminId: string;
	categoryType?: CategoryType;
	regularFormatProperties?: RegularFormatProperties;
	createdAt: string;
	updatedAt: string;
	__v: number;
}

export interface CategoriesResponse {
	success: boolean;
	message: string;
	data: Category[];
	count: number;
}

import type { WorkingHour } from "../utils/workingHours";

export interface AdminInfo {
	_id: string;
	name: string;
	email: string;
	location?: {
		latitude: number;
		longitude: number;
		address?: string;
	};
	businessName?: string | null;
	businessPhone?: string | null;
	websiteUrl?: string | null;
	businessCoverImage?: string | null;
	workingHours?: WorkingHour[];
	isOpen?: boolean | null;
	averageRating?: number;
}

export interface SearchCategory extends Omit<Category, "adminId"> {
	admin: AdminInfo;
	distance?: number;
}

export interface SearchCategoriesResponse {
	success: boolean;
	message: string;
	data: SearchCategory[];
	count: number;
	userLocation?: {
		latitude: number;
		longitude: number;
	};
}
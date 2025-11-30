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

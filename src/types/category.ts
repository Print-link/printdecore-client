export interface Category {
	_id: string;
	id: string;
	name: string;
	unitPrice: number;
	description: string;
	adminId: string;
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


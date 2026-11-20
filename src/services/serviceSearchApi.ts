import axios from "axios";
import type { ApiResponse } from "./api";
import { BASE_URL, handleApiError } from "./orderApi";

/** A product the customer can start setting up, with where it sits in the catalogue */
export interface ServiceSearchResult {
	serviceTemplateId: string;
	name: string;
	subCategoryId: string;
	subCategoryName: string;
	categoryId: string;
	categoryName: string;
	startingPrice?: number;
	quoteOnRequest: boolean;
	popular: boolean;
}

/** Search what the customer types. No query → popular products; pageBased → document printing. */
export const searchServices = async (params: { q?: string; pageBased?: boolean; limit?: number }) => {
	try {
		const response = await axios.get<ApiResponse<ServiceSearchResult[]>>(`${BASE_URL}/service-templates/search`, {
			params: { ...params, pageBased: params.pageBased ? "true" : undefined },
		});
		return response.data.data ?? [];
	} catch (error) {
		return handleApiError(error, "Couldn't search");
	}
};

import axios from "axios";
import { BASE_URL } from "./orderApi";

export const bussinessCategoryService = {
	getAllBussinessCategories: async (businessId: string) => {
		const response = await axios.get(
			`${BASE_URL}/categories/admin/${businessId}`
		);
		return response.data;
	},

	getCategoryById: async (categoryId: string) => {
		const response = await axios.get(`${BASE_URL}/categories/${categoryId}`);
		return response.data;
	},

	searchCategories: async (
		search?: string,
		latitude?: number,
		longitude?: number,
		maxDistance?: number
	) => {
		const params = new URLSearchParams();
		if (search) params.append("search", search);
		if (latitude !== undefined) params.append("latitude", latitude.toString());
		if (longitude !== undefined)
			params.append("longitude", longitude.toString());
		if (maxDistance !== undefined)
			params.append("maxDistance", maxDistance.toString());

		const response = await axios.get(
			`${BASE_URL}/categories/search?${params.toString()}`
		);
		return response.data;
	},
};
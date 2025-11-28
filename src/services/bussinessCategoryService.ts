import axios from "axios";
import { BASE_URL } from "./orderApi";

export const bussinessCategoryService = {
    getAllBussinessCategories: async (businessId: string) => {
        const response = await axios.get(`${BASE_URL}/categories/admin/${businessId}`);
        return response.data;
    },

    getCategoryById: async (categoryId: string) => {
		const response = await axios.get(`${BASE_URL}/categories/${categoryId}`);
		return response.data;
	},
}
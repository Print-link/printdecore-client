import { useQuery } from "@tanstack/react-query";
import { getCategories, getSubCategories } from "../services/orderApi";

export const useCategories = () => {
	return useQuery({
		queryKey: ["categories"],
		queryFn: async () => {
			const response = await getCategories();
			return response.data || [];
		},
		staleTime: 1000 * 60 * 10, // 10 minutes (categories don't change often)
	});
};

export const useSubCategories = (categoryId: string | undefined) => {
	return useQuery({
		queryKey: ["subCategories", categoryId],
		queryFn: async () => {
			if (!categoryId) return [];
			const response = await getSubCategories(categoryId);
			return response.data || [];
		},
		enabled: !!categoryId,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
};


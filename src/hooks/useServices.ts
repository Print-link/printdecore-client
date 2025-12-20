import { useQuery } from "@tanstack/react-query";
import {
	getServiceTemplates,
	getAgentServices,
	type ServiceTemplate,
	type AgentService,
} from "../services/orderApi";

export const useServiceTemplates = (subCategoryId: string | undefined) => {
	return useQuery({
		queryKey: ["serviceTemplates", subCategoryId],
		queryFn: async () => {
			if (!subCategoryId) return [];
			const response = await getServiceTemplates(subCategoryId);
			return response.data || [];
		},
		enabled: !!subCategoryId,
		staleTime: 1000 * 60 * 10, // 10 minutes
	});
};

export const useAgentServices = (
	branchId: string | undefined,
	serviceTemplateId: string | undefined
) => {
	return useQuery({
		queryKey: ["agentServices", branchId, serviceTemplateId],
		queryFn: async () => {
			if (!branchId || !serviceTemplateId) return [];
			const response = await getAgentServices(branchId, serviceTemplateId);
			return response.data || [];
		},
		enabled: !!branchId && !!serviceTemplateId,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};


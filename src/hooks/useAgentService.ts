import { useState, useEffect } from "react";
import { getAgentServices, type AgentService } from "../services/orderApi";

export const useAgentService = (
	agentServiceId: string | null,
	branchId: string | undefined,
	serviceTemplateId: string | null
) => {
	const [agentService, setAgentService] = useState<AgentService | null>(null);
	const [commissionRate, setCommissionRate] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAgentService = async () => {
			if (!branchId || (!agentServiceId && !serviceTemplateId)) {
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getAgentServices(
					branchId,
					serviceTemplateId || ""
				);
				if (response.success && response.data) {
					let service: AgentService | undefined;

					if (agentServiceId) {
						service = response.data.find((s) => s.id === agentServiceId);
					} else if (serviceTemplateId) {
						service = response.data[0];
					}

					if (service) {
						setAgentService(service);
					} else {
						setError("Agent service not found");
					}

					// Extract commission rate from response
					if ((response as any).commissionRate !== undefined) {
						setCommissionRate(Number((response as any).commissionRate) || 0);
					}
				}
			} catch (err: unknown) {
				console.error("Error fetching agent service:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load agent service";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		fetchAgentService();
	}, [agentServiceId, branchId, serviceTemplateId]);

	return { agentService, commissionRate, loading, error, setAgentService };
};


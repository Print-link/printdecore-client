import { useState, useEffect } from "react";
import { getAgentServices, type AgentService } from "../services/orderApi";

export const useAgentService = (
	agentServiceId: string | null,
	branchId: string | undefined,
	serviceTemplateId: string | null
) => {
	const [agentService, setAgentService] = useState<AgentService | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchAgentService = async () => {
			if (!agentServiceId) {
				setError("Agent Service ID is missing");
				setLoading(false);
				return;
			}

			try {
				setLoading(true);
				setError(null);
				const response = await getAgentServices(
					branchId || "",
					serviceTemplateId || ""
				);
				if (response.success && response.data) {
					const service = response.data.find((s) => s.id === agentServiceId);
					if (service) {
						setAgentService(service);
					} else {
						setError("Agent service not found");
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

	return { agentService, loading, error };
};


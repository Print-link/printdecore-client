import { useQuery } from "@tanstack/react-query";
import { getBranchesNearMe, type Branch } from "../services/orderApi";

export const useBranchesNearMe = (
	latitude?: number,
	longitude?: number,
	radius?: number,
	enabled: boolean = true
) => {
	return useQuery({
		queryKey: ["branches", "nearme", latitude, longitude, radius],
		queryFn: async () => {
			if (!latitude || !longitude) {
				return [];
			}
			const response = await getBranchesNearMe(latitude, longitude, radius);
			return response.data || [];
		},
		enabled: enabled && !!latitude && !!longitude,
		staleTime: 1000 * 60 * 5, // 5 minutes
	});
};


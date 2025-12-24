import { useQuery } from "@tanstack/react-query";
import { apiService } from "../services/api";
import type {
	PrintStation,
	UserLocation,
	LocationPermission,
} from "../types/printStation";

interface UsePrintStationsReturn {
	printStations: PrintStation[];
	loading: boolean;
	error: string | null;
}

export const usePrintStations = (
	userLocation: UserLocation | null,
	locationPermission: LocationPermission
): UsePrintStationsReturn => {
	const {
		data,
		isLoading,
		error: queryError,
	} = useQuery({
		queryKey: [
			"branches",
			"nearme",
			userLocation?.latitude,
			userLocation?.longitude,
		],
		queryFn: async () => {
			if (!userLocation?.latitude || !userLocation?.longitude) {
				return { success: true, data: { printStations: [] } };
			}

			return await apiService.getBranchesNearMe(
				userLocation.latitude,
				userLocation.longitude,
				50 // maxDistance in km
			);
		},
		enabled: !!(userLocation || locationPermission === "denied"),
		staleTime: 1000 * 60 * 5, // 5 minutes
	});

	const printStations = data?.data?.printStations || [];
	const error = queryError
		? queryError instanceof Error
			? queryError.message
			: "Failed to load print stations"
		: data?.success === false
		? "Failed to load print stations"
		: null;

	return {
		printStations,
		loading: isLoading,
		error,
	};
};

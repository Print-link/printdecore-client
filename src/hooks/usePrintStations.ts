import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import type { PrintStation, UserLocation, LocationPermission } from "../types/printStation";

interface UsePrintStationsReturn {
	printStations: PrintStation[];
	loading: boolean;
	error: string | null;
}

export const usePrintStations = (
	userLocation: UserLocation | null,
	locationPermission: LocationPermission
): UsePrintStationsReturn => {
	const [printStations, setPrintStations] = useState<PrintStation[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPrintStations = async () => {
			try {
				setLoading(true);
				setError(null);

				// Pass location if available, otherwise fetch all stations
				const response = await apiService.getAllPrintStations(
					userLocation?.latitude,
					userLocation?.longitude,
					50 // maxDistance in km (optional, can be made configurable)
				);

				if (response.success && response.data?.printStations) {
					setPrintStations(response.data.printStations);
				} else {
					setError("Failed to load print stations");
				}
			} catch (err: unknown) {
				console.error("Error fetching print stations:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to load print stations";
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		};

		// Only fetch if we have location or if location was denied (to show all stations)
		if (userLocation || locationPermission === "denied") {
			fetchPrintStations();
		}
	}, [userLocation, locationPermission]);

	return { printStations, loading, error };
};


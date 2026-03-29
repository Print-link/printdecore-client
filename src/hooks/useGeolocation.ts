import { useState, useEffect, useCallback } from "react";
import type { UserLocation, LocationPermission } from "../types/printStation";
import {
	getCachedLocation,
	setCachedLocation,
	getLocationWithFallback,
} from "../utils/locationUtils";

interface UseGeolocationReturn {
	userLocation: UserLocation | null;
	locationError: string | null;
	locationPermission: LocationPermission;
	requestLocation: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
	const cached = getCachedLocation();

	const [userLocation, setUserLocation] = useState<UserLocation | null>(
		cached ? { latitude: cached.lat, longitude: cached.lng } : null
	);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [locationPermission, setLocationPermission] =
		useState<LocationPermission>(cached ? "granted" : "prompt");

	const requestLocation = useCallback(() => {
		setLocationError(null);

		getLocationWithFallback({
			onSuccess: (coords) => {
				const location: UserLocation = {
					latitude: coords.lat,
					longitude: coords.lng,
				};
				setCachedLocation(coords.lat, coords.lng);
				setUserLocation(location);
				setLocationPermission("granted");
				setLocationError(null);
			},
			onError: (error, isDenied) => {
				setLocationError(error);
				if (isDenied) {
					setLocationPermission("denied");
				}
			},
		});
	}, []);

	useEffect(() => {
		// If cached, silently refresh in background
		if (userLocation) {
			requestLocation();
			return;
		}
		requestLocation();
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return {
		userLocation,
		locationError,
		locationPermission,
		requestLocation,
	};
};

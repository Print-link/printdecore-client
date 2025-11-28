import { useState, useEffect } from "react";
import type { UserLocation, LocationPermission } from "../types/printStation";

interface UseGeolocationReturn {
	userLocation: UserLocation | null;
	locationError: string | null;
	locationPermission: LocationPermission;
	requestLocation: () => void;
}

export const useGeolocation = (): UseGeolocationReturn => {
	const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [locationPermission, setLocationPermission] =
		useState<LocationPermission>("prompt");

	const checkPermissionAndGetLocation = async () => {
		if (!navigator.geolocation) {
			setLocationError("Geolocation is not supported by your browser");
			setLocationPermission("denied");
			return;
		}

		// Check permission state using Permissions API if available
		if ("permissions" in navigator) {
			try {
				const permission = await navigator.permissions.query({
					name: "geolocation" as PermissionName,
				});

				if (permission.state === "denied") {
					setLocationPermission("denied");
					setLocationError(
						"Location access is blocked. Please enable it in your browser settings to see nearby stations."
					);
					return;
				}

				if (permission.state === "granted") {
					setLocationPermission("granted");
				}
			} catch {
				// Permissions API might not be fully supported, continue with geolocation request
				console.log(
					"Permissions API not fully supported, proceeding with geolocation"
				);
			}
		}

		// Request location
		navigator.geolocation.getCurrentPosition(
			(position) => {
				const location: UserLocation = {
					latitude: position.coords.latitude,
					longitude: position.coords.longitude,
				};
				setUserLocation(location);
				setLocationPermission("granted");
				setLocationError(null);
			},
			(error) => {
				console.error("Geolocation error:", error);
				setLocationPermission("denied");
				switch (error.code) {
					case error.PERMISSION_DENIED:
						setLocationError(
							"Location access denied. Click 'Enable Location' to allow access and see nearby stations."
						);
						break;
					case error.POSITION_UNAVAILABLE:
						setLocationError(
							"Location information unavailable. Please check your device settings."
						);
						break;
					case error.TIMEOUT:
						setLocationError("Location request timed out. Please try again.");
						break;
					default:
						setLocationError(
							"An unknown error occurred while getting your location."
						);
						break;
				}
			},
			{
				enableHighAccuracy: true,
				timeout: 15000,
				maximumAge: 0, // Always get fresh location
			}
		);
	};

	// Request user location on mount
	useEffect(() => {
		checkPermissionAndGetLocation();
	}, []);

	// Manual function to request location again
	const requestLocation = () => {
		setLocationError(null);
		setLocationPermission("prompt");
		checkPermissionAndGetLocation();
	};

	return {
		userLocation,
		locationError,
		locationPermission,
		requestLocation,
	};
};


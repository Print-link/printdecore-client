import type { PrintStation, UserLocation } from "../types/printStation";

export const filterStations = (
	stations: PrintStation[],
	searchQuery: string
): PrintStation[] => {
	if (!searchQuery.trim()) {
		return stations;
	}

	const query = searchQuery.toLowerCase().trim();
	return stations.filter((station) => {
		const businessNameMatch = station.businessName
			?.toLowerCase()
			.includes(query);
		const nameMatch = station.name.toLowerCase().includes(query);

		return businessNameMatch || nameMatch;
	});
};

export const getDirectionsUrl = (
	station: PrintStation,
	userLocation: UserLocation | null
): string | null => {
	if (!station.location?.latitude || !station.location?.longitude) {
		return null;
	}

	const destination = `${station.location.latitude},${station.location.longitude}`;

	// If user location is available, use it as origin
	if (userLocation) {
		const origin = `${userLocation.latitude},${userLocation.longitude}`;
		return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
	} else {
		// If no user location, Google Maps will prompt for current location
		return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
	}
};

export const getDistanceColor = (distance?: number): string => {
	if (distance === undefined) return "";
	if (distance > 50) return "text-red-600";
	if (distance > 25) return "text-orange-600";
	return "text-[#63A361]";
};

export const formatDistance = (distance?: number): string => {
	if (distance === undefined) return "";
	if (distance > 50) return "Too far away";
	return `${distance} km away`;
};


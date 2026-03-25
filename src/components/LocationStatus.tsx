import { Compass } from "@phosphor-icons/react";
import type { LocationPermission } from "../types/printStation";

interface LocationStatusProps {
	locationError: string | null;
	locationPermission: LocationPermission;
	userLocation: { latitude: number; longitude: number } | null;
	onRequestLocation: () => void;
}

export const LocationStatus = ({
	locationError,
	locationPermission,
	userLocation,
	onRequestLocation,
}: LocationStatusProps) => {
	if (locationError) {
		return (
			<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
				<p className="text-sm text-yellow-800 mb-3">{locationError}</p>
				{locationPermission === "denied" && (
					<button
						onClick={onRequestLocation}
						className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white bg-[#fbbf24] hover:bg-[#fbbf24] rounded-lg transition-colors touch-manipulation"
					>
						<Compass size={16} weight="regular" className="mr-2" />
						Enable Location
					</button>
				)}
			</div>
		);
	}

	if (locationPermission === "prompt" && !userLocation && !locationError) {
		return (
			<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
				<p className="text-sm text-blue-800">
					📍 Requesting your location to show nearby stations...
				</p>
			</div>
		);
	}

	return null;
};


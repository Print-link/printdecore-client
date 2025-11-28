import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { PrintStation } from "../types/printStation";
import { useGeolocation } from "../hooks/useGeolocation";
import { usePrintStations } from "../hooks/usePrintStations";
import { filterStations, getDirectionsUrl } from "../utils/stationUtils";
import { LocationStatus } from "../components/LocationStatus";
import { SearchBar } from "../components/SearchBar";
import { PrintStationGrid } from "../components/PrintStationGrid";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export const Home = () => {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const navigate = useNavigate();

	const { userLocation, locationError, locationPermission, requestLocation } =
		useGeolocation();

	const { printStations, loading, error } = usePrintStations(
		userLocation,
		locationPermission
	);

	const filteredStations = useMemo(
		() => filterStations(printStations, searchQuery),
		[printStations, searchQuery]
	);

	const handleStationClick = (stationId: string) => {
		navigate(`/print-station/${stationId}`);
	};

	const handleGetDirections = (e: React.MouseEvent, station: PrintStation) => {
		e.stopPropagation(); // Prevent card click

		const url = getDirectionsUrl(station, userLocation);
		if (!url) {
			alert("Location information not available for this station");
			return;
		}

		window.open(url, "_blank");
	};

	const clearSearch = () => {
		setSearchQuery("");
	};

	if (loading) {
		return <LoadingState />;
	}

	if (error) {
		return <ErrorState error={error} />;
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			<LocationStatus
				locationError={locationError}
				locationPermission={locationPermission}
				userLocation={userLocation}
				onRequestLocation={requestLocation}
			/>

			<SearchBar
				searchQuery={searchQuery}
				onSearchChange={setSearchQuery}
				resultCount={filteredStations.length}
			/>

			{printStations.length === 0 ? (
				<EmptyState type="no-stations" />
			) : filteredStations.length === 0 ? (
				<EmptyState type="no-results" onClearSearch={clearSearch} />
			) : (
				<PrintStationGrid
					stations={filteredStations}
					onStationClick={handleStationClick}
					onGetDirections={handleGetDirections}
				/>
			)}
		</div>
	);
};

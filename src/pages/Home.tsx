import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "../hooks/useGeolocation";
import { usePrintStations } from "../hooks/usePrintStations";
import { filterStations } from "../utils/stationUtils";
import { LocationStatus } from "../components/LocationStatus";
import { SearchAutocomplete } from "../components/SearchAutocomplete";
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
		navigate(`/categories/${stationId}`);
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

			<div className="mb-6">
				<SearchAutocomplete
					placeholder="Search services, categories, or branches..."
					className="mb-4"
				/>
				{/* Legacy search for branches */}
				<input
					type="text"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Search branches by name..."
					className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent"
				/>
			</div>

			{printStations.length === 0 ? (
				<EmptyState type="no-stations" />
			) : filteredStations.length === 0 ? (
				<EmptyState type="no-results" onClearSearch={clearSearch} />
			) : (
				<PrintStationGrid
					stations={filteredStations}
					onStationClick={handleStationClick}
				/>
			)}
		</div>
	);
};

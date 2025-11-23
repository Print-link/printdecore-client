import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
	Printer,
	MapPin,
	Mail,
	Loader2,
	AlertCircle,
	Search,
	X,
	Navigation,
} from "lucide-react";
import { apiService } from "../services/api";

interface PrintStation {
	_id: string;
	id?: string;
	name: string;
	email: string;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
	};
	distance?: number;
}

export const Home = () => {
	const [printStations, setPrintStations] = useState<PrintStation[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [userLocation, setUserLocation] = useState<{
		latitude: number;
		longitude: number;
	} | null>(null);
	const [locationError, setLocationError] = useState<string | null>(null);
	const [locationPermission, setLocationPermission] = useState<
		"prompt" | "granted" | "denied"
	>("prompt");
	const navigate = useNavigate();

	// Check permission state and request location
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
				const location = {
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

	// Fetch print stations with location if available
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

	const handleStationClick = (stationId: string) => {
		navigate(`/print-station/${stationId}`);
	};

	// Filter print stations based on search query
	const filteredStations = useMemo(() => {
		if (!searchQuery.trim()) {
			return printStations;
		}

		const query = searchQuery.toLowerCase().trim();
		return printStations.filter((station) => {
			const nameMatch = station.name.toLowerCase().includes(query);
			const emailMatch = station.email.toLowerCase().includes(query);
			const locationMatch = station.location?.address
				?.toLowerCase()
				.includes(query);

			return nameMatch || emailMatch || locationMatch;
		});
	}, [printStations, searchQuery]);

	const clearSearch = () => {
		setSearchQuery("");
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-slate-700 animate-spin" />
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Error Loading Print Stations
					</h2>
					<p className="text-gray-600">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Location Status */}
			{locationError && (
				<div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<div className="flex items-start justify-between">
						<div className="flex-1">
							<p className="text-sm text-yellow-800 mb-2">{locationError}</p>
							{locationPermission === "denied" && (
								<button
									onClick={requestLocation}
									className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-800 bg-yellow-100 hover:bg-yellow-200 rounded-md transition-colors"
								>
									<Navigation className="w-4 h-4 mr-2" />
									Enable Location
								</button>
							)}
						</div>
					</div>
				</div>
			)}
			{userLocation && !locationError && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
					<p className="text-sm text-green-800">
						📍 Showing stations near you (sorted by distance)
					</p>
				</div>
			)}
			{locationPermission === "prompt" && !userLocation && !locationError && (
				<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
					<p className="text-sm text-blue-800">
						📍 Requesting your location to show nearby stations...
					</p>
				</div>
			)}

			{/* Search Bar */}
			<div className="mb-6">
				<div className="relative">
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						placeholder="Search by name, email, or location..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full pl-11 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm sm:text-base bg-white"
					/>
					{searchQuery && (
						<button
							onClick={clearSearch}
							className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
							aria-label="Clear search"
						>
							<X className="h-5 w-5" />
						</button>
					)}
				</div>
				{searchQuery && (
					<p className="mt-2 text-sm text-gray-600">
						{filteredStations.length === 0
							? "No print stations found"
							: `Found ${filteredStations.length} print station${
									filteredStations.length !== 1 ? "s" : ""
							  }`}
					</p>
				)}
			</div>

			{printStations.length === 0 ? (
				<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
					<Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-600">
						No print stations available at the moment.
					</p>
				</div>
			) : filteredStations.length === 0 ? (
				<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
					<Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-600 mb-2">
						No print stations found matching your search.
					</p>
					<button
						onClick={clearSearch}
						className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
					>
						Clear search
					</button>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{filteredStations.map((station) => (
						<button
							key={station._id || station.id}
							onClick={() =>
								handleStationClick(station._id || station.id || "")
							}
							className="bg-white rounded-xl p-6 hover:shadow-xl transition-all text-left group border border-gray-300 touch-manipulation"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center group-hover:bg-slate-200 transition-colors">
									<Printer className="w-6 h-6 text-slate-700" />
								</div>
							</div>
							<h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-slate-700 transition-colors">
								{station.name}
							</h3>
							<div className="space-y-2">
								{station.email && (
									<div className="flex items-center text-sm text-gray-600">
										<Mail className="w-4 h-4 mr-2 text-gray-400" />
										<span className="truncate">{station.email}</span>
									</div>
								)}
								{station.location?.address && (
									<div className="flex items-start text-sm text-gray-600">
										<MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 shrink-0" />
										<span className="line-clamp-2">
											{station.location.address}
										</span>
									</div>
								)}
								{station.distance !== undefined && (
									<div className="flex items-center text-sm font-medium text-indigo-600">
										<Navigation className="w-4 h-4 mr-2" />
										<span>{station.distance} km away</span>
									</div>
								)}
							</div>
							<div className="mt-4 pt-4 border-t border-gray-200">
								<span className="text-sm font-medium text-slate-700 group-hover:text-slate-800">
									Submit Print Job →
								</span>
							</div>
						</button>
					))}
				</div>
			)}
		</div>
	);
};

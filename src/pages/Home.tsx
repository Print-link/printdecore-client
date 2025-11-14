import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Printer, MapPin, Mail, Loader2, AlertCircle } from "lucide-react";
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
}

export const Home = () => {
	const [printStations, setPrintStations] = useState<PrintStation[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	useEffect(() => {
		const fetchPrintStations = async () => {
			try {
				setLoading(true);
				setError(null);
				const response = await apiService.getAllPrintStations();
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

		fetchPrintStations();
	}, []);

	const handleStationClick = (stationId: string) => {
		navigate(`/print-station/${stationId}`);
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
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
			{/* <div className="text-center mb-6 sm:mb-8">
				<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full mb-3 sm:mb-4">
					<Printer className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					Select a Print Station
				</h1>
				<p className="text-sm sm:text-base text-gray-600">
					Choose a print station to submit your print job
				</p>
			</div> */}

			{printStations.length === 0 ? (
				<div className="bg-white rounded-2xl shadow-xl p-8 text-center">
					<Printer className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<p className="text-gray-600">
						No print stations available at the moment.
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
					{printStations.map((station) => (
						<button
							key={station._id || station.id}
							onClick={() =>
								handleStationClick(station._id || station.id || "")
							}
							className="bg-white rounded-xl p-6 hover:shadow-xl transition-all text-left group border border-gray-300 touch-manipulation"
						>
							<div className="flex items-start justify-between mb-4">
								<div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
									<Printer className="w-6 h-6 text-indigo-600" />
								</div>
							</div>
							<h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
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
							</div>
							<div className="mt-4 pt-4 border-t border-gray-200">
								<span className="text-sm font-medium text-indigo-600 group-hover:text-indigo-700">
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

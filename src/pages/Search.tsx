import { useState, useEffect, useCallback } from "react";
import { useGeolocation } from "../hooks/useGeolocation";
import { LocationStatus } from "../components/LocationStatus";
import { SearchAutocomplete } from "../components/SearchAutocomplete";
import { FilterSidebar } from "../components/FilterSidebar";
import { ServiceCard } from "../components/ServiceCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import {
	searchCategories,
	type SearchFilters,
	type SearchResponse,
} from "../services/orderApi";
import { Loader2, Sliders, X, ChevronLeft, ChevronRight } from "lucide-react";

export const Search = () => {
	const { userLocation, locationError, locationPermission, requestLocation } =
		useGeolocation();

	const [filters, setFilters] = useState<SearchFilters>({
		page: 1,
		limit: 20,
		sortBy: "name",
		sortOrder: "asc",
	});
	const [searchData, setSearchData] = useState<SearchResponse | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);
	const [showFilters, setShowFilters] = useState<boolean>(false);

	// Update filters with location when available
	useEffect(() => {
		if (userLocation) {
			setFilters((prev) => ({
				...prev,
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				radiusKm: prev.radiusKm || 10,
			}));
		}
	}, [userLocation]);

	// Perform search
	const performSearch = useCallback(async (searchFilters: SearchFilters) => {
		setLoading(true);
		setError(null);

		try {
			const response = await searchCategories(searchFilters);
			if (response.success && response.data) {
				setSearchData(response.data);
			} else {
				setError("Failed to search services");
				setSearchData(null);
			}
		} catch (err: unknown) {
			console.error("Error searching:", err);
			const errorMessage =
				err instanceof Error ? err.message : "Failed to search services";
			setError(errorMessage);
			setSearchData(null);
		} finally {
			setLoading(false);
		}
	}, []);

	// Search when filters change
	useEffect(() => {
		// Only search if we have location or user has explicitly searched
		if (userLocation || filters.query || locationPermission === "denied") {
			performSearch(filters);
		}
	}, [filters, userLocation, locationPermission, performSearch]);

	const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
		setFilters((prev) => ({ ...prev, ...newFilters }));
	};

	const handlePageChange = (page: number) => {
		setFilters((prev) => ({ ...prev, page }));
	};

	const handleSortChange = (sortBy: SearchFilters["sortBy"]) => {
		setFilters((prev) => ({
			...prev,
			sortBy,
			page: 1,
		}));
	};

	if (loading && !userLocation && locationPermission !== "denied" && !filters.query) {
		return <LoadingState />;
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			<LocationStatus
				locationError={locationError}
				locationPermission={locationPermission}
				userLocation={userLocation}
				onRequestLocation={requestLocation}
			/>

			{/* Search Header */}
			<div className="mb-6">
				<div className="flex flex-col md:flex-row gap-4 mb-4">
					<div className="flex-1">
						<SearchAutocomplete
							onSelect={(type, id) => {
								if (type === "category") {
									handleFilterChange({ categoryId: id, page: 1 });
								} else if (type === "subCategory") {
									handleFilterChange({ subCategoryId: id, page: 1 });
								}
							}}
							placeholder="Search services, categories..."
						/>
					</div>
					<button
						onClick={() => setShowFilters(!showFilters)}
						className="md:hidden px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50"
					>
						<Sliders className="w-5 h-5" />
						Filters
					</button>
				</div>

				{/* Query Input */}
				<input
					type="text"
					value={filters.query || ""}
					onChange={(e) =>
						handleFilterChange({ query: e.target.value, page: 1 })
					}
					placeholder="Or type to search..."
					className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
				/>
			</div>

			{/* Main Content */}
			<div className="flex flex-col lg:flex-row gap-6">
				{/* Filter Sidebar */}
				<div
					className={`${
						showFilters ? "block" : "hidden"
					} lg:block lg:w-64 shrink-0`}
				>
					<FilterSidebar
						filters={filters}
						onFilterChange={handleFilterChange}
						aggregations={searchData?.aggregations}
						onClose={() => setShowFilters(false)}
					/>
				</div>

				{/* Results */}
				<div className="flex-1">
					{loading && searchData === null ? (
						<LoadingState />
					) : error && !searchData ? (
						<ErrorState error={error} />
					) : searchData && searchData.results.length === 0 ? (
						<EmptyState
							type="no-results"
							onClearSearch={() => handleFilterChange({ query: undefined, page: 1 })}
						/>
					) : (
						<>
							{/* Results Header */}
							<div className="flex items-center justify-between mb-4">
								<div>
									<h2 className="text-lg font-semibold text-gray-900">
										{searchData?.pagination.total || 0} results found
									</h2>
									{searchData?.pagination.total && searchData.pagination.total > 0 && (
										<p className="text-sm text-gray-500 mt-1">
											Showing {((searchData.pagination.page - 1) * searchData.pagination.limit) + 1} -{" "}
											{Math.min(
												searchData.pagination.page * searchData.pagination.limit,
												searchData.pagination.total
											)}{" "}
											of {searchData.pagination.total}
										</p>
									)}
								</div>
								<div className="flex items-center gap-2">
									<label className="text-sm text-gray-700">Sort by:</label>
									<select
										value={filters.sortBy || "name"}
										onChange={(e) =>
											handleSortChange(
												e.target.value as SearchFilters["sortBy"]
											)
										}
										className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
									>
										<option value="name">Name</option>
										<option value="price">Price</option>
										<option value="createdAt">Newest</option>
										<option value="popularity">Popularity</option>
									</select>
									<select
										value={filters.sortOrder || "asc"}
										onChange={(e) =>
											handleFilterChange({
												sortOrder: e.target.value as "asc" | "desc",
												page: 1,
											})
										}
										className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
									>
										<option value="asc">Asc</option>
										<option value="desc">Desc</option>
									</select>
								</div>
							</div>

							{/* Results Grid */}
							{loading ? (
								<div className="flex items-center justify-center py-12">
									<Loader2 className="w-8 h-8 text-[#63A361] animate-spin" />
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
									{searchData?.results.map((result) => (
										<ServiceCard key={result.id} result={result} />
									))}
								</div>
							)}

							{/* Pagination */}
							{searchData && searchData.pagination.totalPages > 1 && (
								<div className="flex items-center justify-center gap-2">
									<button
										onClick={() =>
											handlePageChange(searchData.pagination.page - 1)
										}
										disabled={!searchData.pagination.hasPrev}
										className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
									>
										<ChevronLeft className="w-4 h-4" />
										Previous
									</button>
									<span className="px-4 py-2 text-sm text-gray-700">
										Page {searchData.pagination.page} of{" "}
										{searchData.pagination.totalPages}
									</span>
									<button
										onClick={() =>
											handlePageChange(searchData.pagination.page + 1)
										}
										disabled={!searchData.pagination.hasNext}
										className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 flex items-center gap-2"
									>
										Next
										<ChevronRight className="w-4 h-4" />
									</button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
};

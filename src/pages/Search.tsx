import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "../hooks/useGeolocation";
import { bussinessCategoryService } from "../services/bussinessCategoryService";
import { LocationStatus } from "../components/LocationStatus";
import { SearchBar } from "../components/SearchBar";
import { CategoryCard } from "../components/CategoryCard";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import type { SearchCategory } from "../types/category";

export const Search = () => {
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [categories, setCategories] = useState<SearchCategory[]>([]);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const navigate = useNavigate();

	const { userLocation, locationError, locationPermission, requestLocation } =
		useGeolocation();

	// Search categories when location is available or search query changes
	useEffect(() => {
		const searchCategories = async () => {
			try {
				setLoading(true);
				setError(null);

				// If we have location, search with location
				// Otherwise, search without location (will return all categories matching search query)
				const response = await bussinessCategoryService.searchCategories(
					searchQuery.trim() || undefined,
					userLocation?.latitude,
					userLocation?.longitude
				);

				if (response.success && response.data) {
					setCategories(response.data);
				} else {
					setError("Failed to load categories");
					setCategories([]);
				}
			} catch (err: unknown) {
				console.error("Error searching categories:", err);
				const errorMessage =
					err instanceof Error ? err.message : "Failed to search categories";
				setError(errorMessage);
				setCategories([]);
			} finally {
				setLoading(false);
			}
		};

		// Only search if we have location or if user has explicitly searched
		// If location is not available but user hasn't searched, wait for location
		if (userLocation || searchQuery.trim()) {
			searchCategories();
		} else if (locationPermission === "denied") {
			// If location is denied, search without location
			searchCategories();
		} else {
			// Still waiting for location
			setLoading(true);
		}
	}, [userLocation, searchQuery, locationPermission]);

	const handleCategoryClick = (categoryId: string, adminId: string) => {
		// Navigate to print station details page with the selected category
		navigate(`/print-station/${adminId}?category=${categoryId}`);
	};

	const clearSearch = () => {
		setSearchQuery("");
	};

	if (loading && !userLocation && locationPermission !== "denied") {
		return <LoadingState />;
	}

	if (error && categories.length === 0) {
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
				resultCount={categories.length}
				placeholder="Search categories by name..."
				resultLabel="category"
			/>

			{loading ? (
				<LoadingState />
			) : categories.length === 0 ? (
				<EmptyState
					type="no-categories"
					onClearSearch={clearSearch}
					message={
						searchQuery.trim()
							? "No categories found matching your search."
							: userLocation
							? "No categories found near your location."
							: "No categories available. Please enable location to see nearby categories."
					}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
					{categories.map((category) => (
						<CategoryCard
							key={category._id || category.id}
							category={category}
							onCategoryClick={handleCategoryClick}
						/>
					))}
				</div>
			)}
		</div>
	);
};

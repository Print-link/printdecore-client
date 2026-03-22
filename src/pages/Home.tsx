import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Star, Zap, Sparkles, Search, ChevronDown, MapPin, Wrench } from "lucide-react";
import { useGeolocation } from "../hooks/useGeolocation";
import { usePrintStations } from "../hooks/usePrintStations";
import { useCategories } from "../hooks/useCategories";
import { filterStations, type SearchMode } from "../utils/stationUtils";
import { LocationStatus } from "../components/LocationStatus";
import { PrintStationCardHorizontal } from "../components/PrintStationCardHorizontal";
import { CategoryCardHorizontal } from "../components/CategoryCardHorizontal";
import { HorizontalScrollSection } from "../components/HorizontalScrollSection";
import { EmptyState } from "../components/EmptyState";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMode, setSearchMode] = useState<SearchMode | undefined>(undefined);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { userLocation, locationError, locationPermission, requestLocation } =
    useGeolocation();

  const { printStations, loading, error } = usePrintStations(
    userLocation,
    locationPermission,
  );

  const { data: categories = [], isLoading: categoriesLoading } =
    useCategories();

  const filteredStations = useMemo(
    () => filterStations(printStations, searchQuery, searchMode),
    [printStations, searchQuery, searchMode],
  );

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const popularStations = useMemo(() => {
    return [...printStations]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10);
  }, [printStations]);

  const topRatedStations = useMemo(() => {
    return [...printStations]
      .filter((station) => (station.averageRating || 0) >= 4.0)
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10);
  }, [printStations]);

  const fastDeliveryStations = useMemo(() => {
    return [...printStations]
      .filter((station) => station.distance !== undefined)
      .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity))
      .slice(0, 10);
  }, [printStations]);

  const newStations = useMemo(() => {
    return [...printStations].sort(() => Math.random() - 0.5).slice(0, 10);
  }, [printStations]);

  const handleStationClick = (stationId: string) => {
    navigate(`/home/categories/${stationId}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    navigate(`/home/search?categoryId=${categoryId}`);
  };

  const clearSearch = () => setSearchQuery("");

  if (loading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="w-full max-w-5xl mx-auto">
      <LocationStatus
        locationError={locationError}
        locationPermission={locationPermission}
        userLocation={userLocation}
        onRequestLocation={requestLocation}
      />

      {/* Search area */}
      <div className="mb-8 mt-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
          Printdecore
        </p>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mb-5 leading-tight">
          Find a print agent<br className="sm:hidden" /> near you
        </h1>

        {/* Branch filter with search mode dropdown */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                searchMode === "location"
                  ? "Search by location…"
                  : searchMode === "service"
                  ? "Search by service…"
                  : "Filter by branch name…"
              }
              className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 focus:border-[#fbbf24] transition-all"
            />
          </div>

          {/* Search mode dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-700 rounded-2xl text-gray-700 dark:text-gray-300 shadow-sm hover:border-[#fbbf24]/60 focus:outline-none focus:ring-2 focus:ring-[#fbbf24]/50 transition-all whitespace-nowrap"
            >
              {searchMode === "location" ? (
                <MapPin className="w-4 h-4 text-[#fbbf24]" />
              ) : searchMode === "service" ? (
                <Wrench className="w-4 h-4 text-[#fbbf24]" />
              ) : (
                <Search className="w-4 h-4 text-gray-400" />
              )}
              <span className="hidden sm:inline">
                {searchMode === "location"
                  ? "Location"
                  : searchMode === "service"
                  ? "Service"
                  : "Branch"}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 z-50 mt-2 w-44 bg-white dark:bg-[#1e1e1e] border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl shadow-black/8 overflow-hidden">
                <button
                  onClick={() => { setSearchMode(undefined); setDropdownOpen(false); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
                    !searchMode ? "text-[#fbbf24] font-semibold bg-amber-50/50 dark:bg-amber-900/10" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Branch
                </button>
                <button
                  onClick={() => { setSearchMode("location"); setDropdownOpen(false); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
                    searchMode === "location" ? "text-[#fbbf24] font-semibold bg-amber-50/50 dark:bg-amber-900/10" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <MapPin className="w-4 h-4" />
                  Location
                </button>
                <button
                  onClick={() => { setSearchMode("service"); setDropdownOpen(false); setSearchQuery(""); }}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors ${
                    searchMode === "service" ? "text-[#fbbf24] font-semibold bg-amber-50/50 dark:bg-amber-900/10" : "text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Service
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Branch search results */}
      {searchQuery && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white">
              Results for "{searchQuery}"
            </h2>
            <button
              onClick={clearSearch}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
          {filteredStations.length === 0 ? (
            <EmptyState type="no-results" onClearSearch={clearSearch} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStations.map((station) => (
                <PrintStationCardHorizontal
                  key={station._id || station.id}
                  station={station}
                  onStationClick={handleStationClick}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Marketplace feed */}
      {!searchQuery && (
        <div className="space-y-1">
          {popularStations.length > 0 && (
            <HorizontalScrollSection
              title="Popular"
              subtitle="Most visited by customers"
              icon={<TrendingUp className="w-4 h-4 text-[#fbbf24]" />}
              showAllLink="/home/search?sort=popular"
            >
              {popularStations.map((station) => (
                <PrintStationCardHorizontal
                  key={station._id || station.id}
                  station={station}
                  onStationClick={handleStationClick}
                />
              ))}
            </HorizontalScrollSection>
          )}

          {!categoriesLoading && categories.length > 0 && (
            <HorizontalScrollSection
              title="Categories"
              subtitle="Browse by service type"
              showAllLink="/home/categories"
            >
              {categories.map((category) => (
                <CategoryCardHorizontal
                  key={category.id}
                  category={category}
                  onCategoryClick={handleCategoryClick}
                />
              ))}
            </HorizontalScrollSection>
          )}

          {topRatedStations.length > 0 && (
            <HorizontalScrollSection
              title="Top Rated"
              subtitle="Highest rated by our users"
              icon={<Star className="w-4 h-4 text-[#fbbf24] fill-[#fbbf24]" />}
              showAllLink="/home/search?sort=rating"
            >
              {topRatedStations.map((station) => (
                <PrintStationCardHorizontal
                  key={station._id || station.id}
                  station={station}
                  onStationClick={handleStationClick}
                />
              ))}
            </HorizontalScrollSection>
          )}

          {fastDeliveryStations.length > 0 && (
            <HorizontalScrollSection
              title="Nearest to You"
              subtitle="Closest agents in your area"
              icon={<Zap className="w-4 h-4 text-[#fbbf24]" />}
              showAllLink="/home/search?sort=distance"
            >
              {fastDeliveryStations.map((station) => (
                <PrintStationCardHorizontal
                  key={station._id || station.id}
                  station={station}
                  onStationClick={handleStationClick}
                />
              ))}
            </HorizontalScrollSection>
          )}

          {newStations.length > 0 && (
            <HorizontalScrollSection
              title="New on Printdecore"
              subtitle="Recently joined agents"
              icon={<Sparkles className="w-4 h-4 text-[#fbbf24]" />}
              showAllLink="/home/search?sort=new"
            >
              {newStations.map((station) => (
                <PrintStationCardHorizontal
                  key={station._id || station.id}
                  station={station}
                  onStationClick={handleStationClick}
                />
              ))}
            </HorizontalScrollSection>
          )}

          {printStations.length === 0 && <EmptyState type="no-stations" />}
        </div>
      )}
    </div>
  );
};

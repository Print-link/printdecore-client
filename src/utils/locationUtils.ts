const LOCATION_CACHE_KEY = "piper_user_location";
const LOCATION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CachedLocation {
  lat: number;
  lng: number;
  timestamp: number;
}

export function getCachedLocation(): { lat: number; lng: number } | null {
  try {
    const raw = localStorage.getItem(LOCATION_CACHE_KEY);
    if (!raw) return null;
    const cached: CachedLocation = JSON.parse(raw);
    if (Date.now() - cached.timestamp > LOCATION_CACHE_TTL) {
      localStorage.removeItem(LOCATION_CACHE_KEY);
      return null;
    }
    return { lat: cached.lat, lng: cached.lng };
  } catch {
    return null;
  }
}

export function setCachedLocation(lat: number, lng: number) {
  try {
    const data: CachedLocation = { lat, lng, timestamp: Date.now() };
    localStorage.setItem(LOCATION_CACHE_KEY, JSON.stringify(data));
  } catch {
    // localStorage might be full or blocked
  }
}

/**
 * IP-based geolocation fallback.
 * Uses the free ipapi.co service (no API key needed, 1000 req/day).
 */
async function getLocationByIP(): Promise<{ lat: number; lng: number }> {
  const response = await fetch("https://ipapi.co/json/", {
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error("IP geolocation failed");
  }

  const data = await response.json();

  if (data.latitude && data.longitude) {
    return { lat: data.latitude, lng: data.longitude };
  }

  throw new Error("No coordinates in IP geolocation response");
}

interface LocationCallbacks {
  onSuccess: (coords: { lat: number; lng: number }) => void;
  onError: (message: string, isDenied: boolean) => void;
}

/**
 * Attempts browser geolocation first, then falls back to IP-based geolocation.
 * Only reports "denied" when the user explicitly blocked permission.
 */
export function getLocationWithFallback({ onSuccess, onError }: LocationCallbacks) {
  if (!("geolocation" in navigator)) {
    // No browser geolocation at all — go straight to IP fallback
    getLocationByIP()
      .then(onSuccess)
      .catch(() => {
        onError("Could not determine your location. Please try again.", false);
      });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      onSuccess({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    (error) => {
      if (error.code === error.PERMISSION_DENIED) {
        // User explicitly denied — no fallback can help
        onError(
          "Location access denied. Please enable it in your browser settings.",
          true
        );
        return;
      }

      // POSITION_UNAVAILABLE or TIMEOUT — try IP fallback
      getLocationByIP()
        .then(onSuccess)
        .catch(() => {
          onError(
            "Could not determine your location. Please check your connection and try again.",
            false
          );
        });
    },
    {
      enableHighAccuracy: false, // faster, more reliable on HTTP
      timeout: 8000,
      maximumAge: 300000, // 5 min cache
    }
  );
}

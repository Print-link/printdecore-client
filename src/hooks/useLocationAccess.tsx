import { useEffect, useState, useCallback } from "react";
import {
  getCachedLocation,
  setCachedLocation,
  getLocationWithFallback,
} from "../utils/locationUtils";

interface LocationState {
  permission: "granted" | "denied" | "prompt" | "checking";
  coordinates: { lat: number; lng: number } | null;
  error: string;
  isLoading: boolean;
}

export const useLocationAccess = () => {
  const cached = getCachedLocation();

  const [state, setState] = useState<LocationState>({
    permission: cached ? "granted" : "checking",
    coordinates: cached,
    error: "",
    isLoading: false,
  });

  const requestLocation = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: "" }));

    getLocationWithFallback({
      onSuccess: (coords) => {
        setCachedLocation(coords.lat, coords.lng);
        setState({
          permission: "granted",
          coordinates: coords,
          error: "",
          isLoading: false,
        });
      },
      onError: (message, isDenied) => {
        setState((prev) => ({
          ...prev,
          permission: isDenied ? "denied" : "prompt",
          error: message,
          isLoading: false,
        }));
      },
    });
  }, []);

  // On mount: if cached, silently refresh. Otherwise request.
  useEffect(() => {
    requestLocation();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for permission changes
  useEffect(() => {
    if (!("permissions" in navigator)) return;

    let cleanup: (() => void) | undefined;

    navigator.permissions
      .query({ name: "geolocation" })
      .then((result) => {
        const handler = () => {
          const perm = result.state as LocationState["permission"];
          setState((prev) => ({ ...prev, permission: perm }));
          // Re-request if permission was just granted
          if (perm === "granted") {
            requestLocation();
          }
        };
        result.addEventListener("change", handler);
        cleanup = () => result.removeEventListener("change", handler);
      })
      .catch(() => {});

    return () => cleanup?.();
  }, [requestLocation]);

  return {
    ...state,
    requestLocation,
    hasLocation: !!state.coordinates,
    // Only show blocking modal when explicitly denied
    needsPermission: state.permission === "denied",
  };
};

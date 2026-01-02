import { useEffect, useState } from "react";

interface LocationState {
    permission: 'granted' | 'denied' | 'prompt' | 'checking';
    coordinates: { lat: number; lng: number } | null;
    error: string;
    isLoading: boolean;
  }

export const useLocationAccess = () => {
    const [state, setState] = useState<LocationState>({
      permission: 'checking',
      coordinates: null,
      error: '',
      isLoading: false
    });
  
    // Check initial permission status
    useEffect(() => {
      checkPermission();
    }, []);
  
    // Auto-request if permission granted but no coordinates
    useEffect(() => {
      if (state.permission === 'granted' && !state.coordinates && !state.isLoading) {
        requestLocation();
      }
    }, [state.permission, state.coordinates, state.isLoading]);
  
    const checkPermission = async () => {
      if (!('geolocation' in navigator)) {
        setState(prev => ({
          ...prev,
          error: 'Geolocation not supported',
          permission: 'denied'
        }));
        return;
      }
  
      try {
        if ('permissions' in navigator) {
          const result = await navigator.permissions.query({ name: 'geolocation' });
          setState(prev => ({ ...prev, permission: result.state as 'granted' | 'denied' | 'prompt' }));
          
          // Listen for permission changes
          result.addEventListener('change', () => {
            setState(prev => ({ ...prev, permission: result.state as 'granted' | 'denied' | 'prompt' }));
          });
        } else {
          setState(prev => ({ ...prev, permission: 'prompt' }));
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({ ...prev, permission: 'prompt', error: errorMessage }));
      }
    };
  
    const requestLocation = () => {
      setState(prev => ({ ...prev, isLoading: true, error: '' }));
  
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            permission: 'granted',
            coordinates: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            error: '',
            isLoading: false
          });
        },
        (error) => {
          let errorMessage = '';
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location access denied. Please enable in browser settings.';
              setState(prev => ({ ...prev, permission: 'denied' }));
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location unavailable. Please try again.';
              break;
            case error.TIMEOUT:
              errorMessage = 'Request timed out. Please try again.';
              break;
            default:
              errorMessage = 'Error getting location.';
          }
          setState(prev => ({
            ...prev,
            error: errorMessage,
            isLoading: false
          }));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes cache
        }
      );
    };
  
    return {
      ...state,
      requestLocation,
      hasLocation: !!state.coordinates,
      needsPermission: state.permission !== 'granted'
    };
  };
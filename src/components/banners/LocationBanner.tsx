import { MapPin } from "lucide-react";

export const LocationBanner = ({
    hasLocation,
    needsPermission
  }: {
    hasLocation: boolean;
    needsPermission: boolean;
  }) => {
    if (hasLocation) return null;
  
    return (
      <div className="px-4 py-3 bg-amber-50 border-b border-amber-200">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-900">
              {needsPermission ? 'Location Required' : 'Getting location...'}
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Enable to find nearby stations
            </p>
          </div>
        </div>
      </div>
    );
  };
import { MapPin } from "@phosphor-icons/react";

export const LocationBanner = ({
    hasLocation,
    needsPermission
  }: {
    hasLocation: boolean;
    needsPermission: boolean;
  }) => {
    if (hasLocation) return null;
  
    return (
      <div className="px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border-b border-amber-200 dark:border-amber-900/40">
        <div className="flex items-start gap-2">
          <MapPin size={16} weight="regular" className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-amber-900 dark:text-amber-200">
              {needsPermission ? 'Location is off' : 'Getting location...'}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
              Turn it on to see print shops near you
            </p>
          </div>
        </div>
      </div>
    );
  };
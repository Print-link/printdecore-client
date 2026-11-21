import { MapPin } from '@phosphor-icons/react';

interface LocationModalProps {
  isOpen: boolean;
  permission: 'granted' | 'denied' | 'prompt' | 'checking';
  error: string;
  isLoading: boolean;
  onRequestLocation: () => void;
  /** Carry on without it: shops show unsorted, and the customer types an address at checkout */
  onSkip: () => void;
}

export const LocationModal = ({
  isOpen,
  permission,
  error,
  isLoading,
  onRequestLocation,
  onSkip
}: LocationModalProps) => {
  if (!isOpen) return null;

  const handleOpenSettings = () => {
    alert(
      'To enable location access:\n\n' +
      '1. Click the lock icon in your browser\'s address bar\n' +
      '2. Find "Location" permissions\n' +
      '3. Select "Allow"\n' +
      '4. Refresh the page'
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4">
          <MapPin size={32} weight="duotone" className="text-amber-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
          Use your location?
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6">
          We use it to show print shops near you and send your order to a printer nearby. You can also type an address when you order.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={onRequestLocation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-lg font-semibold hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Requesting...</span>
              </>
            ) : (
              <>
                <MapPin size={20} weight="duotone" />
                <span>Enable Location Access</span>
              </>
            )}
          </button>

          {permission === 'denied' && (
            <button
              onClick={handleOpenSettings}
              className="w-full px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Open Settings Guide
            </button>
          )}

          <button
            onClick={onSkip}
            className="w-full px-6 py-3 text-gray-600 dark:text-gray-400 rounded-lg font-semibold hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Continue without location
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-5 h-5 shrink-0 mt-0.5">
              <svg className="w-full h-full text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="flex-1">
              Your location is only used to find shops and printers near you.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
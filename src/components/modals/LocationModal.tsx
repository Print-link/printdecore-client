import { MapPin } from '@phosphor-icons/react';
import { Button, Sheet } from '../ui';

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
    <Sheet open onClose={onSkip} label="Use your location?">
      <div className="px-5 pt-3 pb-5">
        <span className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-fill text-ink mb-4">
          <MapPin size={24} />
        </span>
        <h2 className="text-xl font-bold title-tight text-ink">Use your location?</h2>
        <p className="mt-1 text-sm text-ink-2">
          We use it to show print shops near you and send your order to a printer nearby. It's only used for that. You can also type an address when you order.
        </p>

        {error && <p className="mt-4 rounded-lg bg-bad-tint px-3 py-2.5 text-sm text-bad">{error}</p>}

        <div className="mt-5 space-y-2">
          <Button block onClick={onRequestLocation} loading={isLoading} icon={<MapPin size={18} />}>
            {isLoading ? "Asking…" : "Use my location"}
          </Button>
          {permission === 'denied' && (
            <Button block variant="secondary" onClick={handleOpenSettings}>How to allow it</Button>
          )}
          <Button block variant="ghost" onClick={onSkip}>Not now</Button>
        </div>
      </div>
    </Sheet>
  );
};

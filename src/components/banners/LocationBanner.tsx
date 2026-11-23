import { MapPin } from "@phosphor-icons/react";

/** One quiet line under the header while location is off — not a yellow alert */
export const LocationBanner = ({
	hasLocation,
	needsPermission,
	onTurnOn,
}: {
	hasLocation: boolean;
	needsPermission: boolean;
	onTurnOn?: () => void;
}) => {
	if (hasLocation) return null;
	return (
		<div className="bg-surface border-b border-line">
			<div className="max-w-5xl mx-auto h-10 px-4 sm:px-6 lg:px-8 flex items-center gap-2 text-sm">
				<MapPin size={16} className="shrink-0 text-ink-3" />
				<p className="flex-1 min-w-0 truncate text-ink-2">
					{needsPermission ? "Location is off — showing all shops" : "Finding your location…"}
				</p>
				{needsPermission && onTurnOn && (
					<button onClick={onTurnOn} className="tap shrink-0 -mr-2 px-2 py-1 rounded-lg font-semibold text-ink hover:bg-fill">
						Turn on
					</button>
				)}
			</div>
		</div>
	);
};

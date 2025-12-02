import type { PrintStation } from "../types/printStation";
import { PrintStationCard } from "./PrintStationCard";

interface PrintStationGridProps {
	stations: PrintStation[];
	onStationClick: (stationId: string) => void;
}

export const PrintStationGrid = ({
	stations,
	onStationClick,
}: PrintStationGridProps) => {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
			{stations.map((station) => (
				<PrintStationCard
					key={station._id || station.id}
					station={station}
					onStationClick={onStationClick}
				/>
			))}
		</div>
	);
};


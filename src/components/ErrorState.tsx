import { WarningCircle } from "@phosphor-icons/react";

interface ErrorStateProps {
	error: string;
}

export const ErrorState = ({ error }: ErrorStateProps) => {
	return (
		<div className="w-full max-w-6xl mx-auto bg-surface rounded-xl p-8">
			<div className="text-center py-12">
				<WarningCircle size={48} weight="regular" className="text-bad mx-auto mb-4" />
				<h2 className="text-xl font-semibold text-ink mb-2">
					Error Loading Print Stations
				</h2>
				<p className="text-ink-2">{error}</p>
			</div>
		</div>
	);
};


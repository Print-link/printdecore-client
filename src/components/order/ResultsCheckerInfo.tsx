interface ResultsCheckerInfoProps {
	indexNumber?: string;
	yearOfCompletion?: string;
	dateOfBirth?: string;
}

export const ResultsCheckerInfo = ({
	indexNumber,
	yearOfCompletion,
	dateOfBirth,
}: ResultsCheckerInfoProps) => {
	return (
		<div className="bg-surface rounded-lg border-2 border-line p-4">
			<h3 className="text-lg font-bold title-tight text-ink mb-3">
				Results Checker Information
			</h3>
			<div className="space-y-3">
				{indexNumber && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Index Number</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{indexNumber}
						</p>
					</div>
				)}
				{yearOfCompletion && (
					<div>
						<p className="text-xs text-ink-2 mb-1">
							Year of Completion
						</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{yearOfCompletion}
						</p>
					</div>
				)}
				{dateOfBirth && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Date of Birth</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{dateOfBirth}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


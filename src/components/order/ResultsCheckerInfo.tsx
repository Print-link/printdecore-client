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
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3">
				Results Checker Information
			</h3>
			<div className="space-y-3">
				{indexNumber && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Index Number</p>
						<p className="text-sm sm:text-base font-medium text-gray-900">
							{indexNumber}
						</p>
					</div>
				)}
				{yearOfCompletion && (
					<div>
						<p className="text-xs text-gray-500 mb-1">
							Year of Completion
						</p>
						<p className="text-sm sm:text-base font-medium text-gray-900">
							{yearOfCompletion}
						</p>
					</div>
				)}
				{dateOfBirth && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Date of Birth</p>
						<p className="text-sm sm:text-base font-medium text-gray-900">
							{dateOfBirth}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


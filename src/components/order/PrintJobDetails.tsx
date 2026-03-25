interface PrintJobDetailsProps {
	artwork?: string;
	width?: string;
	height?: string;
	size?: string;
	quantity?: number;
	location?: string;
	description?: string;
}

export const PrintJobDetails = ({
	artwork,
	width,
	height,
	size,
	quantity,
	location,
	description,
}: PrintJobDetailsProps) => {
	if (!artwork && !width && !height) {
		return null;
	}

	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
			<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
				Print Job Details
			</h3>
			<div className="space-y-3">
				{artwork && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Artwork</p>
						<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
							{artwork}
						</p>
					</div>
				)}
				{(width || height) && (
					<div className="grid grid-cols-2 gap-3">
						{width && (
							<div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Width</p>
								<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
									{width}
								</p>
							</div>
						)}
						{height && (
							<div>
								<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Height</p>
								<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
									{height}
								</p>
							</div>
						)}
					</div>
				)}
				{size && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Size</p>
						<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
							{size}
						</p>
					</div>
				)}
				{quantity && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity</p>
						<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
							{quantity}
						</p>
					</div>
				)}
				{location && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Location</p>
						<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
							{location}
						</p>
					</div>
				)}
				{description && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
						<p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 break-word">
							{description}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


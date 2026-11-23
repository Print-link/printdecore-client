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
		<div className="bg-surface rounded-lg border-2 border-line p-4">
			<h3 className="text-lg font-bold title-tight text-ink mb-3">
				Print Job Details
			</h3>
			<div className="space-y-3">
				{artwork && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Artwork</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{artwork}
						</p>
					</div>
				)}
				{(width || height) && (
					<div className="grid grid-cols-2 gap-3">
						{width && (
							<div>
								<p className="text-xs text-ink-2 mb-1">Width</p>
								<p className="text-sm sm:text-base font-medium text-ink">
									{width}
								</p>
							</div>
						)}
						{height && (
							<div>
								<p className="text-xs text-ink-2 mb-1">Height</p>
								<p className="text-sm sm:text-base font-medium text-ink">
									{height}
								</p>
							</div>
						)}
					</div>
				)}
				{size && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Size</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{size}
						</p>
					</div>
				)}
				{quantity && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Quantity</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{quantity}
						</p>
					</div>
				)}
				{location && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Location</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{location}
						</p>
					</div>
				)}
				{description && (
					<div>
						<p className="text-xs text-ink-2 mb-1">Description</p>
						<p className="text-sm sm:text-base text-ink break-word">
							{description}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


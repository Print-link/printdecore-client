import { Star } from "@phosphor-icons/react";

interface RatingDisplayProps {
	rating: number; // Average rating (0-5)
	totalRatings?: number;
	size?: "sm" | "md" | "lg";
	showNumbers?: boolean;
	className?: string;
}

export const RatingDisplay = ({
	rating,
	totalRatings,
	size = "md",
	showNumbers = true,
	className = "",
}: RatingDisplayProps) => {
	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 >= 0.5;
	const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

	const iconSizes = {
		sm: 12,
		md: 16,
		lg: 20,
	} as const;

	const textSizeClasses = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			<div className="flex items-center gap-0.5">
				{/* Full stars */}
				{Array.from({ length: fullStars }).map((_, i) => (
					<Star
						key={`full-${i}`}
						size={iconSizes[size]}
						weight="fill"
						className="text-brand"
					/>
				))}
				{/* Half star */}
				{hasHalfStar && (
					<div className="relative inline-block">
						<Star
							size={iconSizes[size]}
							weight="fill"
							className="text-ink-3"
						/>
						<div className="absolute top-0 left-0 overflow-hidden" style={{ width: "50%" }}>
							<Star
								size={iconSizes[size]}
								weight="fill"
								className="text-brand"
							/>
						</div>
					</div>
				)}
				{/* Empty stars */}
				{Array.from({ length: emptyStars }).map((_, i) => (
					<Star
						key={`empty-${i}`}
						size={iconSizes[size]}
						weight="fill"
						className="text-ink-3"
					/>
				))}
			</div>
			{showNumbers && (
				<span className={`${textSizeClasses[size]} font-medium text-ink`}>
					{rating.toFixed(1)}
					{totalRatings !== undefined && (
						<span className="text-ink-2 ml-1">({totalRatings})</span>
					)}
				</span>
			)}
		</div>
	);
};


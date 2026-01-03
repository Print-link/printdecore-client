import { Star } from "lucide-react";

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

	const sizeClasses = {
		sm: "w-3 h-3",
		md: "w-4 h-4",
		lg: "w-5 h-5",
	};

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
						className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
					/>
				))}
				{/* Half star */}
				{hasHalfStar && (
					<div className="relative inline-block">
						<Star
							className={`${sizeClasses[size]} fill-gray-300 text-gray-300`}
						/>
						<div className="absolute top-0 left-0 overflow-hidden" style={{ width: "50%" }}>
							<Star
								className={`${sizeClasses[size]} fill-yellow-400 text-yellow-400`}
							/>
						</div>
					</div>
				)}
				{/* Empty stars */}
				{Array.from({ length: emptyStars }).map((_, i) => (
					<Star
						key={`empty-${i}`}
						className={`${sizeClasses[size]} fill-gray-300 text-gray-300`}
					/>
				))}
			</div>
			{showNumbers && (
				<span className={`${textSizeClasses[size]} font-medium text-gray-700`}>
					{rating.toFixed(1)}
					{totalRatings !== undefined && (
						<span className="text-gray-500 ml-1">({totalRatings})</span>
					)}
				</span>
			)}
		</div>
	);
};


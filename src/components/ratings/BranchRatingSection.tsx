import { useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { RatingDisplay } from "./RatingDisplay";
import { RatingForm } from "./RatingForm";
import { RatingsList } from "./RatingsList";
import { useBranchRatingStats, useMyRating } from "../../hooks/useRatings";
import type { RatingStats } from "../../services/ratingApi";

interface BranchRatingSectionProps {
	branchId: string;
	averageRating?: number;
	totalRatings?: number;
}

export const BranchRatingSection = ({
	branchId,
	averageRating: propAverageRating,
	totalRatings: propTotalRatings,
}: BranchRatingSectionProps) => {
	const [showRatingForm, setShowRatingForm] = useState(false);
	const { data: ratingStats } = useBranchRatingStats(branchId);
	const { data: myRating } = useMyRating(branchId);

	// Use stats from API or props
	// ratingStats is already RatingStats (not RatingStatsResponse), so no need for .data
	const stats: RatingStats | undefined = ratingStats || (propAverageRating !== undefined && propTotalRatings !== undefined
		? {
				average: propAverageRating,
				count: propTotalRatings,
				distribution: {},
		  }
		: undefined);

	const averageRating = stats?.average || 0;
	const totalRatings = stats?.count || 0;

	const getPercentage = (rating: number) => {
		if (!stats?.distribution || totalRatings === 0) return 0;
		const count = stats.distribution[rating] || 0;
		return (count / totalRatings) * 100;
	};

	return (
		<div className="space-y-6">
			{/* Rating Overview */}
			<div className="bg-white border border-gray-200 rounded-lg p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold text-gray-900 mb-2">
							Customer Reviews
						</h2>
						<div className="flex items-center gap-4">
							<RatingDisplay
								rating={averageRating}
								totalRatings={totalRatings}
								size="lg"
							/>
							{totalRatings > 0 && (
								<span className="text-sm text-gray-600">
									Based on {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
								</span>
							)}
						</div>
					</div>
					<button
						onClick={() => setShowRatingForm(!showRatingForm)}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors flex items-center gap-2"
					>
						<MessageSquare className="w-4 h-4" />
						{myRating ? "Update Review" : "Write a Review"}
					</button>
				</div>

				{/* Rating Distribution */}
				{totalRatings > 0 && stats?.distribution && (
					<div className="space-y-2">
						{Array.from({ length: 5 }, (_, i) => 5 - i).map((rating) => {
							const percentage = getPercentage(rating);
							return (
								<div key={rating} className="flex items-center gap-3">
									<div className="flex items-center gap-1 w-20">
										<span className="text-sm font-medium text-gray-700 w-3">
											{rating}
										</span>
										<Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
									</div>
									<div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
										<div
											className="bg-yellow-400 h-full transition-all duration-300"
											style={{ width: `${percentage}%` }}
										/>
									</div>
									<span className="text-sm text-gray-600 w-12 text-right">
										{stats.distribution[rating] || 0}
									</span>
								</div>
							);
						})}
					</div>
				)}
			</div>

			{/* Rating Form */}
			{showRatingForm && (
				<RatingForm
					branchId={branchId}
					onSuccess={() => setShowRatingForm(false)}
					onCancel={() => setShowRatingForm(false)}
				/>
			)}

			{/* Ratings List */}
			<div>
				<h3 className="text-xl font-semibold text-gray-900 mb-4">
					All Reviews ({totalRatings})
				</h3>
				<RatingsList branchId={branchId} />
			</div>
		</div>
	);
};


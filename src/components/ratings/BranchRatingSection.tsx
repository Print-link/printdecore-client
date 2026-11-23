import { useState } from "react";
import { Star, ChatCenteredText } from "@phosphor-icons/react";
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
			<div className="bg-surface border border-line rounded-lg p-6">
				<div className="flex items-start justify-between mb-6">
					<div>
						<h2 className="text-2xl font-bold text-ink mb-2">
							Customer Reviews
						</h2>
						<div className="flex items-center gap-4">
							<RatingDisplay
								rating={averageRating}
								totalRatings={totalRatings}
								size="lg"
							/>
							{totalRatings > 0 && (
								<span className="text-sm text-ink-2">
									Based on {totalRatings} {totalRatings === 1 ? "review" : "reviews"}
								</span>
							)}
						</div>
					</div>
					<button
						onClick={() => setShowRatingForm(!showRatingForm)}
						className="px-4 py-2 bg-ink text-page rounded-xl transition-colors flex items-center gap-2"
					>
						<ChatCenteredText size={16} weight="regular" />
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
										<span className="text-sm font-medium text-ink w-3">
											{rating}
										</span>
										<Star size={16} weight="fill" className="text-brand" />
									</div>
									<div className="flex-1 bg-fill-press rounded-full h-2 overflow-hidden">
										<div
											className="bg-brand h-full transition-all duration-300"
											style={{ width: `${percentage}%` }}
										/>
									</div>
									<span className="text-sm text-ink-2 w-12 text-right">
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
				<h3 className="text-xl font-semibold text-ink mb-4">
					All Reviews ({totalRatings})
				</h3>
				<RatingsList branchId={branchId} />
			</div>
		</div>
	);
};


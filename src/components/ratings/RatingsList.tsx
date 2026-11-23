import { useState } from "react";
import { Star, User } from "@phosphor-icons/react";
import { useBranchRatings } from "../../hooks/useRatings";
import { RatingDisplay } from "./RatingDisplay";
import type { BranchRating } from "../../services/ratingApi";

interface RatingsListProps {
	branchId: string;
	limit?: number;
}

export const RatingsList = ({ branchId, limit: initialLimit = 10 }: RatingsListProps) => {
	const [limit, setLimit] = useState(initialLimit);
	const { data: ratingsData, isLoading, error } = useBranchRatings(branchId, { limit });

	if (isLoading) {
		return (
			<div className="space-y-4">
				{Array.from({ length: 3 }).map((_, i) => (
					<div
						key={i}
						className="border border-line rounded-xl p-4 animate-pulse"
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="w-10 h-10 bg-fill-press rounded-full" />
							<div className="flex-1">
								<div className="h-4 bg-fill-press rounded w-32 mb-2" />
								<div className="h-3 bg-fill-press rounded w-24" />
							</div>
						</div>
						<div className="h-20 bg-fill-press rounded" />
					</div>
				))}
			</div>
		);
	}

	if (error) {
		return (
			<div className="bg-bad-tint rounded-lg p-4 text-bad">
				Failed to load ratings. Please try again later.
			</div>
		);
	}

	if (!ratingsData || ratingsData.data.length === 0) {
		return (
			<div className="bg-gray-50 border border-line rounded-lg p-8 text-center text-ink-2">
				<Star size={48} weight="regular" className="mx-auto mb-3 text-ink-3" />
				<p className="text-lg font-medium">No ratings yet</p>
				<p className="text-sm mt-1">Be the first to rate this branch!</p>
			</div>
		);
	}

	const ratings = ratingsData.data;
	const hasMore = ratingsData.pagination.hasMore;

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const getCustomerName = (rating: BranchRating) => {
		if (rating.customer) {
			return `${rating.customer.firstName} ${rating.customer.lastName}`;
		}
		return "Anonymous";
	};

	return (
		<div className="space-y-4">
			{ratings.map((rating) => (
				<div
					key={rating.id}
					className="border border-line rounded-xl p-4"
				>
					<div className="flex items-start gap-3 mb-3">
						{/* Avatar */}
						<div className="w-10 h-10 bg-fill rounded-full flex items-center justify-center flex-shrink-0">
							{rating.customer?.avatar ? (
								<img
									src={rating.customer.avatar}
									alt={getCustomerName(rating)}
									className="w-10 h-10 rounded-full object-cover"
								/>
							) : (
								<User size={24} weight="regular" className="text-ink-2" />
							)}
						</div>

						{/* Rating Info */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center justify-between mb-1">
								<div>
									<p className="font-semibold text-ink">
										{getCustomerName(rating)}
									</p>
									<div className="flex items-center gap-2 mt-1">
										<RatingDisplay rating={rating.rating} showNumbers={false} size="sm" />
										<span className="text-xs text-ink-2">
											{formatDate(rating.createdAt)}
										</span>
									</div>
								</div>
							</div>

							{/* Review Text */}
							{rating.review && (
								<p className="text-ink mt-2 whitespace-pre-wrap break-words">
									{rating.review}
								</p>
							)}
						</div>
					</div>
				</div>
			))}

			{/* Load More Button */}
			{hasMore && (
				<div className="text-center">
					<button
						onClick={() => setLimit(limit + 10)}
						className="px-4 py-2 text-ink underline underline-offset-2 font-medium transition-colors"
					>
						Load More Reviews
					</button>
				</div>
			)}
		</div>
	);
};


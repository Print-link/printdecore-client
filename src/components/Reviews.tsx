import { useState, useEffect } from "react";
import { Star, MessageSquare, X } from "lucide-react";
// TODO: Update this component to use the new branch-based rating system
// import { getBranchRatings, type BranchRating } from "../services/ratingApi";

// Temporary type until component is updated to use branch ratings
interface Review {
	_id: string;
	stars: number;
	comment?: string;
	createdAt: string;
	client?: {
		fullName?: string;
	};
}

interface ReviewsProps {
	adminId: string;
}

export const Reviews = ({ adminId }: ReviewsProps) => {
	const [reviews, setReviews] = useState<Review[]>([]);
	const [averageRating, setAverageRating] = useState<number>(0);
	const [loading, setLoading] = useState<boolean>(true);
	const [error, setError] = useState<string | null>(null);
	const [showBottomSheet, setShowBottomSheet] = useState(false);

	useEffect(() => {
		const fetchReviews = async () => {
			if (!adminId) return;

			try {
				setLoading(true);
				setError(null);
				// TODO: Update to use branch-based rating API
				// For now, showing empty state
				setReviews([]);
				setAverageRating(0);
			} catch (err) {
				console.error("Error fetching reviews:", err);
				setError("Failed to load reviews");
			} finally {
				setLoading(false);
			}
		};

		fetchReviews();
	}, [adminId]);

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const renderStars = (rating: number) => {
		return Array.from({ length: 5 }, (_, i) => (
			<Star
				key={i}
				className={`w-4 h-4 ${
					i < rating
						? "text-yellow-500 fill-yellow-500"
						: "text-gray-300"
				}`}
			/>
		));
	};

	// Desktop Reviews Sidebar
	const DesktopReviews = () => (
		<div className="hidden lg:block w-80 shrink-0">
			<div className="sticky top-4 bg-white rounded-xl border border-gray-200 p-6">
				<h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
					<MessageSquare className="w-5 h-5 text-[#fbbf24]" />
					Reviews
				</h3>

				{averageRating > 0 && (
					<div className="mb-6 pb-6 border-b border-gray-200">
						<div className="flex items-center gap-2 mb-2">
							<div className="flex items-center gap-1">
								<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
								<span className="text-2xl font-bold text-gray-900">
									{averageRating?.toFixed(1)}
								</span>
							</div>
							<span className="text-sm text-gray-600">
								({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
							</span>
						</div>
					</div>
				)}

				{loading ? (
					<div className="flex items-center justify-center py-8">
						<div className="w-6 h-6 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
					</div>
				) : error ? (
					<div className="text-sm text-red-600 py-4">{error}</div>
				) : reviews.length === 0 ? (
					<div className="text-sm text-gray-500 py-4 text-center">
						No reviews yet
					</div>
				) : (
					<div className="space-y-4 max-h-[600px] overflow-y-auto">
						{reviews.map((review) => (
							<div
								key={review._id}
								className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
							>
								<div className="flex items-start justify-between mb-2">
									<div className="flex-1">
										<p className="text-sm font-semibold text-gray-900">
											{review.client?.fullName || "Anonymous"}
										</p>
										<p className="text-xs text-gray-500">
											{formatDate(review.createdAt)}
										</p>
									</div>
									<div className="flex items-center gap-1">
										{renderStars(review.stars)}
									</div>
								</div>
								{review.comment && (
									<p className="text-sm text-gray-700 mt-2">{review.comment}</p>
								)}
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);

	// Mobile Bottom Sheet
	const MobileBottomSheet = () => (
		<>
			{/* Button to open bottom sheet on mobile */}
			<button
				onClick={() => setShowBottomSheet(true)}
				className="lg:hidden fixed bottom-6 right-6 z-40 bg-[#fbbf24] text-white px-6 py-3 rounded-full  hover:bg-[#fbbf24] transition-colors flex items-center gap-2"
			>
				<MessageSquare className="w-5 h-5" />
				<span className="font-semibold">
					Reviews {reviews.length > 0 && `(${reviews.length})`}
				</span>
			</button>

			{/* Bottom Sheet Overlay */}
			{showBottomSheet && (
				<div
					className="lg:hidden fixed inset-0 bg-black/50 z-50"
					onClick={() => setShowBottomSheet(false)}
				/>
			)}

			{/* Bottom Sheet */}
			<div
				className={`lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 transition-transform duration-300 ${
					showBottomSheet ? "translate-y-0" : "translate-y-full"
				}`}
				style={{ maxHeight: "85vh" }}
			>
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
						<MessageSquare className="w-5 h-5 text-[#fbbf24]" />
						Reviews
					</h3>
					<button
						onClick={() => setShowBottomSheet(false)}
						className="p-2 hover:bg-gray-100 rounded-full transition-colors"
					>
						<X className="w-5 h-5 text-gray-600" />
					</button>
				</div>

				<div
					className="overflow-y-auto"
					style={{ maxHeight: "calc(85vh - 60px)" }}
				>
					<div className="p-4">
						{averageRating > 0 && (
							<div className="mb-6 pb-6 border-b border-gray-200">
								<div className="flex items-center gap-2 mb-2">
									<div className="flex items-center gap-1">
										<Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
										<span className="text-2xl font-bold text-gray-900">
											{averageRating.toFixed(1)}
										</span>
									</div>
									<span className="text-sm text-gray-600">
										({reviews.length}{" "}
										{reviews.length === 1 ? "review" : "reviews"})
									</span>
								</div>
							</div>
						)}

						{loading ? (
							<div className="flex items-center justify-center py-8">
								<div className="w-6 h-6 border-2 border-[#fbbf24] border-t-transparent rounded-full animate-spin"></div>
							</div>
						) : error ? (
							<div className="text-sm text-red-600 py-4">{error}</div>
						) : reviews.length === 0 ? (
							<div className="text-sm text-gray-500 py-4 text-center">
								No reviews yet
							</div>
						) : (
							<div className="space-y-4">
								{reviews.map((review) => (
									<div
										key={review._id}
										className="border-b border-gray-100 pb-4 last:border-0 last:pb-0"
									>
										<div className="flex items-start justify-between mb-2">
											<div className="flex-1">
												<p className="text-sm font-semibold text-gray-900">
													{review.client?.fullName || "Anonymous"}
												</p>
												<p className="text-xs text-gray-500">
													{formatDate(review.createdAt)}
												</p>
											</div>
											<div className="flex items-center gap-1">
												{renderStars(review.stars)}
											</div>
										</div>
										{review.comment && (
											<p className="text-sm text-gray-700 mt-2">
												{review.comment}
											</p>
										)}
									</div>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</>
	);

	return (
		<>
			<DesktopReviews />
			<MobileBottomSheet />
		</>
	);
};


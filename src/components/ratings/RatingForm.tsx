import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import { useMyRating, useCreateRating, useUpdateRating, useDeleteRating } from "../../hooks/useRatings";
import { useAuth } from "../../hooks/useAuth";
import type { CreateRatingData } from "../../services/ratingApi";

interface RatingFormProps {
	branchId: string;
	orderId?: string;
	onSuccess?: () => void;
	onCancel?: () => void;
}

export const RatingForm = ({
	branchId,
	orderId,
	onSuccess,
	onCancel,
}: RatingFormProps) => {
	const { user } = useAuth();
	const { data: myRating } = useMyRating(branchId);
	const createRating = useCreateRating();
	const updateRating = useUpdateRating();
	const deleteRating = useDeleteRating();

	const [rating, setRating] = useState<number>(0);
	const [hoveredRating, setHoveredRating] = useState<number>(0);
	const [review, setReview] = useState<string>("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (myRating) {
			setRating(myRating.rating);
			setReview(myRating.review || "");
		}
	}, [myRating]);

	const handleStarClick = (value: number) => {
		setRating(value);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		
		if (rating === 0) {
			alert("Please select a rating");
			return;
		}

		setIsSubmitting(true);
		try {
			const ratingData: CreateRatingData = {
				rating,
				review: review.trim() || undefined,
				orderId,
			};

			if (myRating) {
				// Update existing rating
				await updateRating.mutateAsync({
					branchId,
					data: ratingData,
				});
			} else {
				// Create new rating
				await createRating.mutateAsync({
					branchId,
					data: ratingData,
				});
			}

			onSuccess?.();
		} catch (error) {
			console.error("Error submitting rating:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!myRating || !confirm("Are you sure you want to delete your rating?")) {
			return;
		}

		try {
			await deleteRating.mutateAsync(branchId);
			setRating(0);
			setReview("");
			onSuccess?.();
		} catch (error) {
			console.error("Error deleting rating:", error);
		}
	};

	if (!user) {
		return (
			<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center text-gray-600">
				Please sign in to leave a rating
			</div>
		);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-gray-900">
					{myRating ? "Update Your Rating" : "Rate This Branch"}
				</h3>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="text-gray-400 hover:text-gray-600 transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				)}
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Star Rating */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Rating <span className="text-red-500">*</span>
					</label>
					<div className="flex items-center gap-1">
						{Array.from({ length: 5 }).map((_, i) => {
							const value = i + 1;
							const isActive = value <= (hoveredRating || rating);
							return (
								<button
									key={i}
									type="button"
									onClick={() => handleStarClick(value)}
									onMouseEnter={() => setHoveredRating(value)}
									onMouseLeave={() => setHoveredRating(0)}
									className="focus:outline-none transition-transform hover:scale-110"
								>
									<Star
										className={`w-8 h-8 ${
											isActive
												? "fill-yellow-400 text-yellow-400"
												: "fill-gray-300 text-gray-300"
										}`}
									/>
								</button>
							);
						})}
						{rating > 0 && (
							<span className="ml-2 text-sm text-gray-600">
								{rating} {rating === 1 ? "star" : "stars"}
							</span>
						)}
					</div>
				</div>

				{/* Review Text */}
				<div>
					<label
						htmlFor="review"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						Review (Optional)
					</label>
					<textarea
						id="review"
						value={review}
						onChange={(e) => setReview(e.target.value)}
						rows={4}
						maxLength={1000}
						className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
						placeholder="Share your experience with this branch..."
					/>
					<p className="mt-1 text-xs text-gray-500">
						{review.length}/1000 characters
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={isSubmitting || rating === 0}
						className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
					>
						{isSubmitting
							? "Submitting..."
							: myRating
							? "Update Rating"
							: "Submit Rating"}
					</button>
					{myRating && (
						<button
							type="button"
							onClick={handleDelete}
							disabled={isSubmitting}
							className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Delete
						</button>
					)}
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							disabled={isSubmitting}
							className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Cancel
						</button>
					)}
				</div>
			</form>
		</div>
	);
};


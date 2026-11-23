import { useState, useEffect } from "react";
import { Star, X } from "@phosphor-icons/react";
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
			<div className="bg-gray-50 border border-line rounded-lg p-4 text-center text-ink-2">
				Please sign in to leave a rating
			</div>
		);
	}

	return (
		<div className="border border-line rounded-xl p-6">
			<div className="flex items-center justify-between mb-4">
				<h3 className="text-lg font-semibold text-ink">
					{myRating ? "Update Your Rating" : "Rate This Branch"}
				</h3>
				{onCancel && (
					<button
						type="button"
						onClick={onCancel}
						className="text-ink-3 hover:text-ink transition-colors"
					>
						<X size={20} weight="bold" />
					</button>
				)}
			</div>

			<form onSubmit={handleSubmit} className="space-y-4">
				{/* Star Rating */}
				<div>
					<label className="block text-sm font-medium text-ink mb-2">
						Rating <span className="text-bad">*</span>
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
										size={32}
										weight="fill"
										className={
											isActive
												? "text-brand"
												: "text-ink-3"
										}
									/>
								</button>
							);
						})}
						{rating > 0 && (
							<span className="ml-2 text-sm text-ink-2">
								{rating} {rating === 1 ? "star" : "stars"}
							</span>
						)}
					</div>
				</div>

				{/* Review Text */}
				<div>
					<label
						htmlFor="review"
						className="block text-sm font-medium text-ink mb-2"
					>
						Review (Optional)
					</label>
					<textarea
						id="review"
						value={review}
						onChange={(e) => setReview(e.target.value)}
						rows={4}
						maxLength={1000}
						className="w-full px-3 py-2 border border-line-strong rounded-md focus:outline-none focus:border-ink"
						placeholder="Share your experience with this branch..."
					/>
					<p className="mt-1 text-xs text-ink-2">
						{review.length}/1000 characters
					</p>
				</div>

				{/* Action Buttons */}
				<div className="flex items-center gap-3">
					<button
						type="submit"
						disabled={isSubmitting || rating === 0}
						className="px-4 py-2 bg-ink text-page rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
							className="px-4 py-2 bg-bad text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Delete
						</button>
					)}
					{onCancel && (
						<button
							type="button"
							onClick={onCancel}
							disabled={isSubmitting}
							className="px-4 py-2 bg-fill text-ink rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
						>
							Cancel
						</button>
					)}
				</div>
			</form>
		</div>
	);
};


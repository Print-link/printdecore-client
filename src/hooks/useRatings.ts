import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	getBranchRatings,
	getMyRating,
	getBranchRatingStats,
	createBranchRating,
	updateBranchRating,
	deleteBranchRating,
	// type BranchRating,
	type CreateRatingData,
	type UpdateRatingData,
	// type RatingStats,
} from "../services/ratingApi";
import { toast } from "react-toastify";

/**
 * Hook to fetch all ratings for a branch
 */
export const useBranchRatings = (
	branchId: string | undefined,
	options?: { limit?: number; offset?: number }
) => {
	return useQuery({
		queryKey: ["branchRatings", branchId, options?.limit, options?.offset],
		queryFn: async () => {
			if (!branchId) return null;
			const response = await getBranchRatings(branchId, options);
			return response;
		},
		enabled: !!branchId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
};

/**
 * Hook to fetch current user's rating for a branch
 */
export const useMyRating = (branchId: string | undefined) => {
	return useQuery({
		queryKey: ["myRating", branchId],
		queryFn: async () => {
			if (!branchId) return null;
			const response = await getMyRating(branchId);
			return response.data;
		},
		enabled: !!branchId,
		staleTime: 1000 * 60 * 2, // 2 minutes
	});
};

/**
 * Hook to fetch rating statistics for a branch
 */
export const useBranchRatingStats = (branchId: string | undefined) => {
	return useQuery({
		queryKey: ["branchRatingStats", branchId],
		queryFn: async () => {
			if (!branchId) return null;
			const response = await getBranchRatingStats(branchId);
			return response.data;
		},
		enabled: !!branchId,
		staleTime: 1000 * 60 * 5, // 5 minutes (stats change less frequently)
	});
};

/**
 * Hook to create or update a rating
 */
export const useCreateRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			branchId,
			data,
		}: {
			branchId: string;
			data: CreateRatingData;
		}) => {
			return await createBranchRating(branchId, data);
		},
		onSuccess: (_response, variables) => {
			// Invalidate related queries
			queryClient.invalidateQueries({
				queryKey: ["branchRatings", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["myRating", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branchRatingStats", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branch", variables.branchId],
			});

			toast.success("Rating submitted successfully!");
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || "Failed to submit rating");
		},
	});
};

/**
 * Hook to update a rating
 */
export const useUpdateRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({
			branchId,
			data,
		}: {
			branchId: string;
			data: UpdateRatingData;
		}) => {
			return await updateBranchRating(branchId, data);
		},
		onSuccess: (_response, variables) => {
			// Invalidate related queries
			queryClient.invalidateQueries({
				queryKey: ["branchRatings", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["myRating", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branchRatingStats", variables.branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branch", variables.branchId],
			});

			toast.success("Rating updated successfully!");
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || "Failed to update rating");
		},
	});
};

/**
 * Hook to delete a rating
 */
export const useDeleteRating = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async (branchId: string) => {
			return await deleteBranchRating(branchId);
		},
		onSuccess: (_response, branchId) => {
			// Invalidate related queries
			queryClient.invalidateQueries({
				queryKey: ["branchRatings", branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["myRating", branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branchRatingStats", branchId],
			});
			queryClient.invalidateQueries({
				queryKey: ["branch", branchId],
			});

			toast.success("Rating deleted successfully!");
		},
		onError: (error: unknown) => {
			toast.error((error as Error).message || "Failed to delete rating", {
				position: "top-right",
				autoClose: 5000,
				hideProgressBar: false,
				closeOnClick: true,
				pauseOnHover: true,
				draggable: true,
			});
		},
	});
};


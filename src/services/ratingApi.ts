import axios from "axios";
import { BASE_URL } from "./orderApi";

const getAuthToken = (): string | null => {
	return localStorage.getItem("token");
};

export interface BranchRating {
	id: string;
	branchId: string;
	customerId: string;
	rating: number; // 1-5
	review?: string;
	orderId?: string;
	createdAt: string;
	updatedAt: string;
	customer?: {
		id: string;
		firstName: string;
		lastName: string;
		email: string;
		avatar?: string;
	};
	order?: {
		id: string;
		status: string;
	};
}

export interface CreateRatingData {
	rating: number;
	review?: string;
	orderId?: string;
}

export interface UpdateRatingData {
	rating?: number;
	review?: string;
}

export interface RatingStats {
	average: number;
	count: number;
	distribution: {
		[key: number]: number; // rating (1-5) -> count
	};
}

export interface RatingResponse {
	success: boolean;
	message?: string;
	data: BranchRating;
	averageRating?: number;
	totalRatings?: number;
}

export interface RatingsListResponse {
	success: boolean;
	data: BranchRating[];
	pagination: {
		total: number;
		limit: number;
		offset: number;
		hasMore: boolean;
	};
	averageRating: {
		average: number;
		count: number;
	};
}

export interface RatingStatsResponse {
	success: boolean;
	data: RatingStats;
}

/**
 * Create or update a rating for a branch
 */
export const createBranchRating = async (
	branchId: string,
	data: CreateRatingData
): Promise<RatingResponse> => {
	try {
		const token = getAuthToken();
		const response = await axios.post<RatingResponse>(
			`${BASE_URL}/branches/${branchId}/ratings`,
			{ ...data, branchId }, // Include branchId in body for validation
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);
		return response.data;
	} catch (error: unknown) {
		console.error("Error creating rating:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to create rating";
		throw new Error(message);
	}
};

/**
 * Get all ratings for a branch
 */
export const getBranchRatings = async (
	branchId: string,
	options?: { limit?: number; offset?: number }
): Promise<RatingsListResponse> => {
	try {
		const params = new URLSearchParams();
		if (options?.limit) params.append("limit", options.limit.toString());
		if (options?.offset) params.append("offset", options.offset.toString());

		const response = await axios.get<RatingsListResponse>(
			`${BASE_URL}/branches/${branchId}/ratings?${params.toString()}`
		);
		return response.data;
	} catch (error: unknown) {
		console.error("Error fetching ratings:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to fetch ratings";
		throw new Error(message);
	}
};

/**
 * Get current user's rating for a branch
 */
export const getMyRating = async (
	branchId: string
): Promise<{ success: boolean; data: BranchRating | null }> => {
	try {
		const token = getAuthToken();
		const response = await axios.get<{
			success: boolean;
			data: BranchRating | null;
		}>(`${BASE_URL}/branches/${branchId}/ratings/my-rating`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error: unknown) {
		console.error("Error fetching my rating:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to fetch your rating";
		throw new Error(message);
	}
};

/**
 * Update a rating for a branch
 */
export const updateBranchRating = async (
	branchId: string,
	data: UpdateRatingData
): Promise<RatingResponse> => {
	try {
		const token = getAuthToken();
		const response = await axios.put<RatingResponse>(
			`${BASE_URL}/branches/${branchId}/ratings`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
					"Content-Type": "application/json",
				},
			}
		);
		return response.data;
	} catch (error: unknown) {
		console.error("Error updating rating:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to update rating";
		throw new Error(message);
	}
};

/**
 * Delete a rating for a branch
 */
export const deleteBranchRating = async (
	branchId: string
): Promise<{ success: boolean; message: string }> => {
	try {
		const token = getAuthToken();
		const response = await axios.delete<{ success: boolean; message: string }>(
			`${BASE_URL}/branches/${branchId}/ratings`,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error: unknown) {
		console.error("Error deleting rating:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to delete rating";
		throw new Error(message);
	}
};

/**
 * Get rating statistics for a branch
 */
export const getBranchRatingStats = async (
	branchId: string
): Promise<RatingStatsResponse> => {
	try {
		const response = await axios.get<RatingStatsResponse>(
			`${BASE_URL}/branches/${branchId}/ratings/stats`
		);
		return response.data;
	} catch (error: unknown) {
		console.error("Error fetching rating stats:", error);
		const message =
			axios.isAxiosError(error) && error.response?.data?.message
				? error.response.data.message
				: "Failed to fetch rating statistics";
		throw new Error(message);
	}
};

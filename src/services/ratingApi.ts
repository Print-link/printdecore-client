import axios from "axios";
import { BASE_URL } from "./orderApi";

const getToken = (): string | null => {
	return localStorage.getItem("token");
};

export interface Review {
	_id: string;
	stars: number;
	comment?: string;
	client: {
		_id: string;
		fullName?: string;
		email?: string;
	};
	createdAt: string;
}

export interface Rating {
	_id: string;
	averageRating: number;
	admin: string;
	reviews: Review[];
	createdAt: string;
	updatedAt: string;
}

export interface RatingResponse {
	success: boolean;
	message?: string;
	data: {
		rating: Rating;
	};
}

/**
 * Get rating by admin ID (print station ID)
 */
export const getRatingByAdmin = async (
	adminId: string
): Promise<RatingResponse> => {
	try {
		const response = await axios.get<RatingResponse>(
			`${BASE_URL}/ratings/admin/${adminId}`,
			{
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
		return response.data;
	} catch (error) {
		console.error("Error fetching rating:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "Failed to fetch rating"
			);
		}
		throw error;
	}
};

/**
 * Add a review to a print station
 */
export const addReview = async (
	adminId: string,
	data: {
		stars: number;
		comment?: string;
		clientId: string;
	}
): Promise<RatingResponse> => {
	const token = getToken();
	if (!token) {
		throw new Error("Authentication required");
	}

	try {
		const response = await axios.post<RatingResponse>(
			`${BASE_URL}/ratings/admin/${adminId}/reviews`,
			data,
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
			}
		);
		return response.data;
	} catch (error) {
		console.error("Error adding review:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "Failed to add review"
			);
		}
		throw error;
	}
};


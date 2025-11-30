import axios, { AxiosError } from "axios";
import type { ApiError } from "./api";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface SupportTicket {
	_id: string;
	message: string;
	response?: string;
	clientId: string | { _id: string; fullName?: string; email?: string; phoneNumber?: string };
	adminId: string | { _id: string; name?: string; email?: string; businessName?: string };
	jobId: string | { _id: string; status?: string; printerName?: string; createdAt?: string };
	createdAt: string;
	updatedAt: string;
}

export interface SupportResponse {
	success: boolean;
	data?: {
		supportTicket?: SupportTicket;
		supportTickets?: SupportTicket[];
	};
	message?: string;
	error?: string;
	count?: number;
}

const getToken = (): string | null => {
	return localStorage.getItem("token");
};

/**
 * Create a new support ticket
 */
export const createSupportTicket = async (data: {
	message: string;
	jobId: string;
	clientId: string;
}): Promise<SupportResponse> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await axios.post<SupportResponse>(
			`${BASE_URL}/support`,
			data,
			{ headers }
		);

		return response.data;
	} catch (error) {
		console.error("Create Support Ticket Error:", error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<SupportResponse>;
			const errorMessage =
				axiosError.response?.data?.message ||
				axiosError.response?.data?.error ||
				axiosError.message ||
				"Failed to create support ticket";

			const customError = new Error(errorMessage) as ApiError;
			customError.status = axiosError.response?.status || 500;
			customError.statusText =
				axiosError.response?.statusText || "Internal Server Error";
			throw customError;
		}

		throw error;
	}
};

/**
 * Get support tickets for a specific job
 */
export const getSupportTicketsByJob = async (
	jobId: string
): Promise<SupportResponse> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await axios.get<SupportResponse>(
			`${BASE_URL}/support/job/${jobId}`,
			{ headers }
		);

		return response.data;
	} catch (error) {
		console.error("Get Support Tickets By Job Error:", error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<SupportResponse>;
			const errorMessage =
				axiosError.response?.data?.message ||
				axiosError.response?.data?.error ||
				axiosError.message ||
				"Failed to fetch support tickets";

			const customError = new Error(errorMessage) as ApiError;
			customError.status = axiosError.response?.status || 500;
			customError.statusText =
				axiosError.response?.statusText || "Internal Server Error";
			throw customError;
		}

		throw error;
	}
};


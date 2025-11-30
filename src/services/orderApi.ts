import axios, { AxiosError } from 'axios';
import type { ApiError } from "./api";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export interface OrderResponse {
	success: boolean;
	data?: {
		orders: unknown[];
	};
	message?: string;
	error?: string;
}

export const getClientOrders = async (
	clientId: string
): Promise<OrderResponse> => {
	const token = localStorage.getItem("token");
	const baseUrl = BASE_URL;

	try {
		const response = await axios.get<OrderResponse>(
			`${baseUrl}/clients/get-client-orders/${clientId}`,
			{
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
			}
		);

		return response.data;
	} catch (error) {
		console.error("Get Client Orders Error:", error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<OrderResponse>;
			const errorMessage =
				axiosError.response?.data?.message ||
				axiosError.response?.data?.error ||
				axiosError.message ||
				"Failed to fetch orders";

			const customError = new Error(errorMessage) as ApiError;
			customError.status = axiosError.response?.status || 500;
			customError.statusText =
				axiosError.response?.statusText || "Internal Server Error";
			throw customError;
		}

		throw error;
	}
};

export interface OrderDetailResponse {
	success: boolean;
	data?: {
		order: unknown;
	};
	message?: string;
	error?: string;
}

export const getClientOrderById = async (
	orderId: string
): Promise<OrderDetailResponse> => {
	const token = localStorage.getItem("token");
	const baseUrl = BASE_URL;

	try {
		const response = await axios.get<OrderDetailResponse>(
			`${baseUrl}/clients/get-client-order-by-id/${orderId}`,
			{
				headers: {
					"Content-Type": "application/json",
					...(token && { Authorization: `Bearer ${token}` }),
				},
			}
		);

		return response.data;
	} catch (error) {
		console.error("Get Client Order By Id Error:", error);

		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<OrderDetailResponse>;
			const errorMessage =
				axiosError.response?.data?.message ||
				axiosError.response?.data?.error ||
				axiosError.message ||
				"Failed to fetch order";

			const customError = new Error(errorMessage) as ApiError;
			customError.status = axiosError.response?.status || 500;
			customError.statusText =
				axiosError.response?.statusText || "Internal Server Error";
			throw customError;
		}

		throw error;
	}
};
import axios from "axios";

const BASE_URL =
	import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api";

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
	errors?: unknown[];
}

export interface ApiError extends Error {
	status?: number;
	statusText?: string;
}

class ApiService {
	private getToken(): string | null {
		return localStorage.getItem("token");
	}

	private async request<T>(
		endpoint: string,
		options: RequestInit = {}
	): Promise<ApiResponse<T>> {
		const token = this.getToken();

		const headers: Record<string, string> = {
			"Content-Type": "application/json",
			...((options.headers as Record<string, string>) || {}),
		};

		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		try {
			const response = await fetch(`${BASE_URL}${endpoint}`, {
				...options,
				headers,
			});

			const data: ApiResponse<T> = await response.json();

			if (!response.ok) {
				// Create error with status info for better error handling
				const error = new Error(
					data.message || data.error || "Request failed"
				) as ApiError;
				error.status = response.status;
				error.statusText = response.statusText;

				// Handle 401 - Unauthorized (token expired/invalid)
				// Don't auto-redirect here - let the calling code decide
				// Auto-redirect was causing issues on page refresh
				if (response.status === 401) {
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					// Only redirect if not during initialization (let AuthContext handle it)
					// We'll check if we're in a navigation context
				}

				throw error;
			}

			return data;
		} catch (error: unknown) {
			// Preserve status info if it exists
			if (error && typeof error === "object" && "status" in error) {
				throw error;
			}
			console.error("API Request Error:", error);
			throw error;
		}
	}

	// Get base URL without /clients for OTP endpoints
	// private getOtpBaseUrl(): string {
	// 	if (!BASE_URL) {
	// 		return "http://localhost:3000/api";
	// 	}
	// 	// Remove /clients from the end of BASE_URL if it exists
	// 	return BASE_URL.replace(/\/clients$/, "");
	// }

	// Unauthenticated request method for public endpoints (no token)
	// private async unauthenticatedRequest<T>(
	// 	endpoint: string,
	// 	options: RequestInit = {}
	// ): Promise<ApiResponse<T>> {
	// 	const headers: Record<string, string> = {
	// 		"Content-Type": "application/json",
	// 		...((options.headers as Record<string, string>) || {}),
	// 	};

	// 	const baseUrl = BASE_URL;

	// 	try {
	// 		const response = await fetch(`${baseUrl}${endpoint}`, {
	// 			...options,
	// 			headers,
	// 		});

	// 		const data: ApiResponse<T> = await response.json();

	// 		if (!response.ok) {
	// 			const error = new Error(
	// 				data.message || data.error || "Request failed"
	// 			) as ApiError;
	// 			error.status = response.status;
	// 			error.statusText = response.statusText;
	// 			throw error;
	// 		}

	// 		return data;
	// 	} catch (error: unknown) {
	// 		if (error && typeof error === "object" && "status" in error) {
	// 			throw error;
	// 		}
	// 		console.error("API Request Error:", error);
	// 		throw error;
	// 	}
	// }

	// Authentication methods
	async register(
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		phoneNumber: string
	) {
		const response = await this.request<{
			customer: {
				id: string;
				firstName: string;
				lastName: string;
				email: string;
				phoneNumber: string;
				createdAt: string;
				updatedAt: string;
			};
			token: string;
		}>("/auth/register/customer", {
			method: "POST",
			body: JSON.stringify({
				firstName,
				lastName,
				email,
				password,
				phoneNumber,
			}),
		});
		return response;
	}

	async login(email: string, password: string) {
		const response = await this.request<{
			customer: {
				id: string;
				email: string;
			};
			token: string;
		}>("/auth/login/customer", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		console.log(response);
		return response;
	}

	async sendOtp(email: string) {
		// OTP endpoints don't require authentication and are at /api/otp/* not /api/clients/otp/*

		const response = await axios.post(`${BASE_URL}/otp/send-otp`, { email });
		return response.data;
	}

	async verifyOtp(email: string, otp: string) {
		// OTP endpoints don't require authentication and are at /api/otp/* not /api/clients/otp/*
		const response = await axios.post(`${BASE_URL}/otp/verify-otp`, {
			email,
			otp,
		});
		return response.data;
	}
	async getProfile() {
		const response = await this.request<{
			client: {
				_id: string;
				email: string;
				fullName: string;
				phoneNumber: string;
				isActive: boolean;
				lastLogin?: string;
				createdAt: string;
				updatedAt: string;
			};
		}>("/clients/profile", {
			method: "GET",
		});
		return response;
	}

	async updateProfile(fullName?: string, email?: string, phoneNumber?: string) {
		const body: {
			fullName?: string;
			email?: string;
			phoneNumber?: string;
		} = {};
		if (fullName) body.fullName = fullName;
		if (email) body.email = email;
		if (phoneNumber) body.phoneNumber = phoneNumber;

		const response = await this.request<{
			client: {
				_id: string;
				email: string;
				fullName: string;
				phoneNumber: string;
				isActive: boolean;
				lastLogin?: string;
				createdAt: string;
				updatedAt: string;
			};
		}>("/clients/profile", {
			method: "PUT",
			body: JSON.stringify(body),
		});
		return response;
	}

	async changePassword(currentPassword: string, newPassword: string) {
		const response = await this.request("/clients/profile/change-password", {
			method: "PUT",
			body: JSON.stringify({ currentPassword, newPassword }),
		});
		return response;
	}

	// Upload file with FormData (for print jobs)
	async uploadFile(formData: FormData, endpoint: string) {
		const token = this.getToken();

		try {
			// Don't set Content-Type header for FormData - browser will set it with boundary
			const headers: Record<string, string> = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const apiBase = BASE_URL;
			const response = await fetch(`${apiBase}${endpoint}`, {
				method: "POST",
				headers,
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				// Create error with status info for better error handling
				const error = new Error(
					data.message || data.error || "Upload failed"
				) as ApiError;
				error.status = response.status;
				error.statusText = response.statusText;

				if (response.status === 401) {
					localStorage.removeItem("token");
					localStorage.removeItem("user");
					// Redirect to login on 401 for uploads (not during initialization)
					setTimeout(() => {
						window.location.href = "/login";
					}, 100);
				}

				throw error;
			}

			return data;
		} catch (error: unknown) {
			console.error("File Upload Error:", error);
			throw error;
		}
	}

	async getBranchesNearMe(
		latitude?: number,
		longitude?: number,
		maxDistance?: number
	) {
		// Use the new branches/nearme endpoint
		if (latitude !== undefined && longitude !== undefined) {
			const params = new URLSearchParams({
				latitude: latitude.toString(),
				longitude: longitude.toString(),
			});
			if (maxDistance !== undefined) {
				params.append("radius", maxDistance.toString());
			}

			const response = await this.request<
				{
					id: string;
					name: string;
					address: string;
					distance?: number;
					operatingHours: {
						[key: string]: {
							open: string;
							close: string;
						};
					};
					coverImage?: string;
					phoneNumber?: string;
					email?: string;
					location?: {
						id: string;
						address: string;
						latitude: number;
						longitude: number;
					};
				}[]
			>(`/branches/nearme?${params.toString()}`, {
				method: "GET",
			});

			// Transform branches to printStations format for backward compatibility
			return {
				...response,
				data: {
					printStations: (response.data || []).map((branch) => ({
						_id: branch.id,
						id: branch.id,
						name: branch.name,
						email: branch.email || "",
						businessName: branch.name,
						businessPhone: branch.phoneNumber,
						businessCoverImage: branch.coverImage,
						location: branch.location
							? {
									latitude: branch.location.latitude,
									longitude: branch.location.longitude,
									address: branch.location.address,
							  }
							: undefined,
						workingHours: branch.operatingHours
							? Object.entries(branch.operatingHours).map(([day, hours]) => ({
									day: day.toLowerCase(),
									isOpen: !!hours.open && !!hours.close,
									openTime: hours.open,
									closeTime: hours.close,
							  }))
							: undefined,
						distance: branch.distance,
						createdAt: undefined,
						updatedAt: undefined,
					})),
				},
			};
		}

		// If no location provided, fetch all branches (or return empty)
		// Note: The new API requires location, so we return empty array
		return {
			success: true,
			data: {
				printStations: [],
			},
		};
	}

	async getBranchById(branchId: string) {
		const response = await this.request<{
			id: string;
			name: string;
			address: string;
			distance?: number;
		}>(`/branches/${branchId}`, {
			method: "GET",
		});
		return response;
	}

	// Note: Order-related methods have been moved to orderApi.ts
	// Use the orderApi service for all order operations
}

export const apiService = new ApiService();

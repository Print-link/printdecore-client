// API Configuration
// Priority: 1. VITE_API_BASE_URL env variable, 2. NODE_ENV production detection, 3. Development (localhost)
// const PRODUCTION_BASE_URL =
// 	"https://piper-server-prototype-ts.onrender.com/api";
// const LOCALHOST_BASE_URL = "http://localhost:3000/api";

// Check if we're in production mode
// const isProduction = (): boolean => {
// 	if (import.meta.env.VITE_NODE_ENV) {
// 		return import.meta.env.VITE_NODE_ENV === "production";
// 	}
// 	return import.meta.env.MODE === "production";
// };

// Get base URL for API requests
// const getBaseUrl = (): string => {
// 	if (import.meta.env.VITE_API_BASE_URL) {
// 		return import.meta.env.VITE_API_BASE_URL;
// 	}
// 	return isProduction() ? PRODUCTION_BASE_URL : LOCALHOST_BASE_URL;
// };

// Get API base URL (same as base URL, kept for backward compatibility)
// const getApiBase = (): string => {
// 	return getBaseUrl();
// };

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Log API configuration in development mode
// if (import.meta.env.DEV) {
// 	console.log("🌐 API Configuration:", {
// 		baseUrl: BASE_URL,
// 		apiBase: getApiBase(),
// 		nodeEnv: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE,
// 		source: import.meta.env.VITE_API_BASE_URL
// 			? "environment variable"
// 			: isProduction()
// 			? "production (NODE_ENV)"
// 			: "localhost (development)",
// 	});
// }

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

	// Authentication methods
	async register(
		fullName: string,
		email: string,
		password: string,
		phoneNumber: string
	) {
		const response = await this.request<{
			client: {
				_id: string;
				email: string;
				fullName: string;
				phoneNumber: string;
				isActive: boolean;
				createdAt: string;
				updatedAt: string;
			};
			token: string;
		}>("/clients/register", {
			method: "POST",
			body: JSON.stringify({ fullName, email, password, phoneNumber }),
		});
		return response;
	}

	async login(email: string, password: string) {
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
			token: string;
		}>("/clients/login", {
			method: "POST",
			body: JSON.stringify({ email, password }),
		});
		console.log(response);
		return response;
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
}

export const apiService = new ApiService();

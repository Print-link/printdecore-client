// API Configuration - Easy switching between localhost and production
// To switch to localhost: change USE_LOCALHOST to true
// Or use environment variable: VITE_API_BASE_URL
const USE_LOCALHOST = true; // Set to true for localhost, false for production

const PRODUCTION_BASE_URL =
	"https://piper-server-prototype-ts.onrender.com/api";
const LOCALHOST_BASE_URL = "http://localhost:3000/api";
const PRODUCTION_API_BASE =
	"https://piper-server-prototype-ts.onrender.com/api";
const LOCALHOST_API_BASE = "http://localhost:3000/api";

// Use environment variable if available, otherwise use config
const getBaseUrl = (): string => {
	if (import.meta.env.VITE_API_BASE_URL) {
		return import.meta.env.VITE_API_BASE_URL;
	}
	return USE_LOCALHOST ? LOCALHOST_BASE_URL : PRODUCTION_BASE_URL;
};

const getApiBase = (): string => {
	if (!USE_LOCALHOST) {
		// Extract base URL and remove /clients if present
		const envUrl = PRODUCTION_BASE_URL;
		const base = envUrl.replace("/clients", "").replace("/api/clients", "/api");
		return base;
	}
	return USE_LOCALHOST ? LOCALHOST_API_BASE : PRODUCTION_API_BASE;
};

const BASE_URL = getBaseUrl();

// Log API configuration in development mode
if (import.meta.env.DEV) {
	console.log("🌐 API Configuration:", {
		baseUrl: BASE_URL,
		apiBase: getApiBase(),
		source: import.meta.env.VITE_API_BASE_URL
			? "environment variable"
			: USE_LOCALHOST
			? "localhost (config)"
			: "production (config)",
	});
}

export interface ApiResponse<T> {
	success: boolean;
	message?: string;
	data?: T;
	error?: string;
	errors?: any[];
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
				const error: any = new Error(
					data.message || data.error || "Request failed"
				);
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
		} catch (error: any) {
			// Preserve status info if it exists
			if (error.status) {
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
		const body: any = {};
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
	async uploadFile(formData: FormData, endpoint: string = "/print/submit") {
		const token = this.getToken();

		try {
			// Don't set Content-Type header for FormData - browser will set it with boundary
			const headers: Record<string, string> = {};
			if (token) {
				headers["Authorization"] = `Bearer ${token}`;
			}

			const apiBase = getApiBase();
			const response = await fetch(`${apiBase}${endpoint}`, {
				method: "POST",
				headers,
				body: formData,
			});

			const data = await response.json();

			if (!response.ok) {
				// Create error with status info for better error handling
				const error: any = new Error(
					data.message || data.error || "Upload failed"
				);
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
		} catch (error: any) {
			console.error("File Upload Error:", error);
			throw error;
		}
	}
}

export const apiService = new ApiService();


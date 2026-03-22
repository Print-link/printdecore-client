import axios from "axios";
import { BASE_URL } from "./orderApi";

const getToken = (): string | null => {
	return localStorage.getItem("token");
};

export interface CreateSplitData {
	name: string;
	type: "percentage" | "flat";
	currency: string; // "NGN" or "GHS"
	subaccounts: Array<{
		subaccount: string; // paystackSubaccountCode
		share: number; // Percentage (0-100) or flat amount
	}>;
	bearer_type?: "account" | "subaccount"; // Who bears transaction charges
	bearer_subaccount?: string; // Subaccount code if bearer_type is "subaccount"
}

export interface CreateSplitResponse {
	status: boolean; // Paystack uses "status" instead of "success"
	message: string;
	data: {
		id: number;
		name: string;
		type: string;
		currency: string;
		integration: number;
		domain: string;
		split_code: string;
		active: boolean;
		owner: number;
		subaccounts: Array<{
			subaccount: {
				id: number;
				subaccount_code: string;
				business_name: string;
				description: string;
				primary_contact_name: string;
				primary_contact_email: string;
				primary_contact_phone: string;
				metadata: unknown;
				percentage_charge: number;
				settlement_bank: string;
				account_number: string;
			};
			share: number;
		}>;
		createdAt: string;
		updatedAt: string;
	};
}

export interface StagedFileInfo {
	url: string;
	publicId: string;
	name: string;
	size?: number;
	type?: string;
	width?: number;
	height?: number;
	format?: string;
	bytes?: number;
}

export interface PendingCartItem {
	agentServiceId: string;
	selectedBaseConfigId?: string;
	selectedOptions?: string[];
	selectedCustomSpecs?: string[];
	width?: number;
	height?: number;
	measurementUnit: string;
	formulaType?: string;
	quantity: number;
	options: Record<string, unknown>;
	calculatedPrice: number;
	fileCount: number;
	stagedFiles?: StagedFileInfo[];
}

export interface InitializePaymentData {
	amount: number | string;
	email: string;
	subaccount?: string;
	split_code?: string;
	metadata?: Record<string, unknown>;
	callback_url?: string;
	currency?: string;
	bearer?: "account" | "subaccount";
	bearer_subaccount?: string;
	// Pending payment context for webhook recovery
	clientId?: string;
	branchId?: string;
	totalPrice?: number;
	cartItems?: PendingCartItem[];
	comment?: string;
}

export interface RecoveredPayment {
	reference: string;
	orderId?: string;
	status: "pending" | "recovered" | "expired";
}

export interface InitializePaymentResponse {
	status: boolean;
	message: string;
	data: {
		authorization_url: string;
		access_code: string;
		reference: string;
	};
}

export interface VerifyPaymentResponse {
	status: boolean;
	message: string;
	data: {
		status: string;
		reference: string;
		amount: number;
		customer: {
			email: string;
		};
	};
}

/**
 * Create a Paystack split configuration
 * This should be called on the backend, but we provide the interface here
 */
export const createSplit = async (
	data: CreateSplitData
): Promise<CreateSplitResponse> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await axios.post<CreateSplitResponse>(
			`${BASE_URL}/payments/split/create`,
			data,
			{ headers }
		);
		return response.data;
	} catch (error) {
		console.error("Error creating split:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "Failed to create split"
			);
		}
		throw error;
	}
};

/**
 * Initialize Paystack payment with split support
 */
export const initializePayment = async (
	data: InitializePaymentData
): Promise<InitializePaymentResponse> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await axios.post<InitializePaymentResponse>(
			`${BASE_URL}/payments/initialize`,
			data,
			{ headers }
		);
		return response.data;
	} catch (error) {
		console.error("Error initializing payment:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "Failed to initialize payment"
			);
		}
		throw error;
	}
};

/**
 * Verify Paystack payment
 */
export const verifyPayment = async (
	reference: string
): Promise<VerifyPaymentResponse> => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	try {
		const response = await axios.get<VerifyPaymentResponse>(
			`${BASE_URL}/payments/verify/${reference}`,
			{ headers }
		);
		return response.data;
	} catch (error) {
		console.error("Error verifying payment:", error);
		if (axios.isAxiosError(error)) {
			throw new Error(
				error.response?.data?.message || "Failed to verify payment"
			);
		}
		throw error;
	}
};

/**
 * Check for payments completed outside the app (webhook recovery).
 * Call on app mount to discover orphaned payments.
 */
export const recoverPayments = async (): Promise<RecoveredPayment[]> => {
	const token = getToken();
	if (!token) return [];

	try {
		const response = await axios.get<{
			status: boolean;
			data: RecoveredPayment[];
		}>(`${BASE_URL}/payments/recover`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		return response.data?.data || [];
	} catch {
		return [];
	}
};

/**
 * Clear a pending payment entry after successful order creation.
 */
export const clearPendingPayment = async (reference: string): Promise<void> => {
	const token = getToken();
	if (!token) return;

	try {
		await axios.delete(`${BASE_URL}/payments/pending/${reference}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
	} catch {
		// Non-blocking
	}
};


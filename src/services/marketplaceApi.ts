import axios from "axios";
import type { ApiResponse } from "./api";
import {
	BASE_URL,
	deliveryFields,
	getAuthHeaders,
	handleApiError,
	type Delivery,
	type MeasurementUnit,
	type Order,
	type PricedItemPayload,
} from "./orderApi";

/**
 * The marketplace: print shops that run their own orders, chosen by the
 * customer, at each shop's own prices. Ordering pays at checkout.
 */

export type OperatingHours = Record<string, { open: string; close: string }>;

export interface MarketplaceVendor {
	id: string;
	name: string;
	coverImage?: string;
	address?: string;
	latitude?: number;
	longitude?: number;
	distanceKm?: number;
	rating: { average: number; count: number };
	/** null when the shop hasn't set opening hours */
	isOpenNow: boolean | null;
	operatingHours: OperatingHours;
	serviceCount: number;
	startingPrice?: number;
	highlights: string[];
}

/** One of a shop's products */
export interface VendorService {
	agentServiceId: string;
	serviceTemplateId: string;
	name: string;
	measurementUnit: MeasurementUnit;
	startingPrice?: number;
	category?: { id: string; name: string };
	subCategory?: { id: string; name: string };
}

export interface VendorProfile extends MarketplaceVendor {
	phoneNumber?: string;
	services: VendorService[];
}

export const listMarketplaceVendors = async (params: {
	latitude?: number;
	longitude?: number;
	q?: string;
}): Promise<MarketplaceVendor[]> => {
	try {
		const response = await axios.get<ApiResponse<MarketplaceVendor[]>>(`${BASE_URL}/marketplace/vendors`, { params });
		return response.data.data ?? [];
	} catch (error) {
		return handleApiError(error, "Couldn't load shops");
	}
};

export const getMarketplaceVendor = async (id: string): Promise<VendorProfile> => {
	try {
		const response = await axios.get<ApiResponse<VendorProfile>>(`${BASE_URL}/marketplace/vendors/${id}`);
		if (!response.data.data) throw new Error(response.data.message || "Shop not found");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't load this shop");
	}
};

/**
 * Place an order with a shop. The server prices it and returns the order
 * waiting for payment — pay it straight away with initializePayment({ metadata: { orderId } }).
 */
export const createMarketplaceOrder = async (input: {
	branchId: string;
	items: Array<PricedItemPayload & { agentServiceId: string }>;
	comment?: string;
	delivery: Delivery;
}): Promise<Order & { shopName?: string }> => {
	try {
		const { delivery, ...rest } = input;
		const response = await axios.post<ApiResponse<Order & { shopName?: string }>>(
			`${BASE_URL}/marketplace/orders`,
			{ ...rest, ...deliveryFields(delivery) },
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't place the order");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't place the order");
	}
};

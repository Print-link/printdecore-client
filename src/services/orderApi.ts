import axios, { AxiosError } from 'axios';
import type { ApiError, ApiResponse } from "./api";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== Types & Interfaces ====================

export type OrderStatus =
	| "PENDING"
	| "QUOTED"
	| "AWAITING_PAYMENT"
	| "PAID"
	| "CONFIRMING_AVAILABILITY"
	| "RECEIVED"
	| "IN_PROGRESS"
	| "PRINTING"
	| "QUALITY_CHECK"
	| "READY_FOR_PICKUP"
	| "OUT_FOR_DELIVERY"
	| "DELIVERED"
	| "COMPLETED"
	| "CANCELLED";

export type MeasurementUnit = "FEET" | "INCH" | "UNIT";

export interface Order {
	id: string;
	clientId: string;
	branchId: string;
	status: OrderStatus;
	totalPrice: number;
	isProvisional?: boolean;
	priceExpiresAt?: string;
	paymentStatus?: string;
	fulfilmentType?: "delivery" | "pickup";
	deliveryAddress?: string;
	recipientPhone?: string;
	/** managed: Printdecore handles it. marketplace: the customer chose a shop. */
	channel?: "managed" | "marketplace";
	declineReason?: string;
	refundStatus?: "pending" | "processed" | "failed";
	estimatedCompletionTime?: string;
	createdAt: string;
	updatedAt: string;
	items?: OrderItem[];
	customQuotes?: CustomQuote[];
}

export interface OrderItem {
	id: string;
	orderId: string;
	agentServiceId: string;
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options?: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
		files?: FileInfo[];
		selectedBaseConfigId?: string;
		selectedOptions?: string[];
		selectedCustomSpecs?: string[];
		[key: string]: unknown;
	};
	calculatedPrice: number;
	/** New pricing: the quote the item was priced with, and its options by name */
	quote?: { pricingModel?: "legacy" | "v2"; currency?: string; summary?: string[] };
	createdAt: string;
	updatedAt: string;
	agentService?: AgentService & {
		serviceTemplate?: {
			id: string;
			name: string;
			subCategoryId?: string;
		};
		subCategory?: {
			id: string;
			name: string;
			categoryId?: string;
		};
		category?: {
			id: string;
			name: string;
			unitPrice?: number;
		};
	};
	selectedConfigDetails?: {
		baseConfig?: { id: string; name: string };
		options?: Array<{ id: string; name: string; priceModifier?: number }>;
		customSpecs?: Array<{ id: string; name: string; priceModifier?: number }>;
	};
}

export interface FileInfo {
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

export interface CustomQuote {
	id: string;
	orderId: string;
	description: string;
	quotedPrice: number;
	status: "PENDING" | "APPROVED" | "REJECTED";
	createdAt: string;
	updatedAt: string;
}

export interface Branch {
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
	payStackSubAccountId?: string; // Paystack subaccount code for payment splitting
	location?: {
		id: string;
		address: string;
		latitude: number;
		longitude: number;
	};
	agentServices?: Array<{
		id: string;
		serviceTemplateId: string;
		serviceName: string;
		categoryName?: string;
		pricePerUnit?: number;
		formulaType?: string;
		isActive: boolean;
		hasFlexiblePricing?: boolean;
	}>;
	totalServicesCount?: number; // Total count of services (may be more than displayed)
	averageRating?: number;
	totalRatings?: number;
}

export interface Category {
	id: string;
	name: string;
	description?: string;
	imageUrl?: string;
	createdAt: string;
	updatedAt: string;
}

export interface SubCategory {
	id: string;
	categoryId: string;
	name: string;
	description?: string;
	imageUrl?: string;
	pricingType: "AREA_BASED" | "UNIT_BASED" | "MIXED" | "CUSTOM_QUOTE";
	createdAt: string;
	updatedAt: string;
}

export interface ServiceTemplate {
	id: string;
	subCategoryId: string;
	imageUrl?: string;
	name: string;
	measurementUnit: MeasurementUnit;
	description?: string;
	allowsCustomSize: boolean;
	supportsFrontBack: boolean;
	supportsColor: boolean;
	supportsPrintCut: boolean;
	pricingFormulaId: string;
	branchId?: string;
	createdAt: string;
	updatedAt: string;
}

// ==================== Flexible Pricing Types ====================

/**
 * Base configuration for flexible pricing (e.g., A6, A5, A4, A3, Custom)
 */
export interface BaseConfiguration {
	id: string;
	name: string;
	description?: string;
	unitPrice: number; // Base price for this configuration
	width?: number; // Optional: predefined width
	height?: number; // Optional: predefined height
	isCustom?: boolean; // If true, allows custom dimensions
}

/**
 * Pricing option (e.g., Color, Front & Back, Print & Cut)
 */
export interface PricingOption {
	id: string;
	name: string;
	description?: string;
	priceModifier: number; // Additional cost (can be percentage or fixed amount)
	modifierType?: "PERCENTAGE" | "FIXED" | "PER_UNIT"; // How the modifier is applied
	default?: boolean; // Whether this option is selected by default
	enabled?: boolean; // Whether this option is enabled
}

/**
 * Custom specification (e.g., Lamination, Binding, Hole Punching)
 */
export interface CustomSpecification {
	id: string;
	name: string;
	description?: string;
	priceModifier: number; // Additional cost
	modifierType?: "PERCENTAGE" | "FIXED" | "PER_UNIT"; // How the modifier is applied
	enabled?: boolean; // Whether this specification is enabled
}

/**
 * Flexible pricing configuration for an agent service
 */
export interface PricingConfig {
	baseConfigurations: BaseConfiguration[];
	options: PricingOption[];
	customSpecifications?: CustomSpecification[];
}

export interface AgentService {
	id: string;
	branchId: string;
	serviceTemplateId: string;
	serviceName?: string;
	pricePerUnit?: number;
	constant?: number;
	colorPriceModifier?: number; // Fixed amount to add when color option is selected (legacy)
	isActive: boolean;
	supportsPrintCut: boolean;
	supportsColor: boolean;
	supportsFrontBack: boolean;
	supportsFrontOnly: boolean;
	formulaType?: string; // Pricing formula type from service template (e.g., "PAGE_BASED", "AREA_FEET")
	pricingConfig?: PricingConfig; // New flexible pricing configuration
	createdAt: string;
	updatedAt: string;
}

// ==================== Helper Functions ====================

export const getAuthHeaders = () => {
	const token = localStorage.getItem("token");
	return {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

export const handleApiError = (error: unknown, defaultMessage: string): never => {
	console.error(`${defaultMessage}:`, error);

	if (axios.isAxiosError(error)) {
		const axiosError = error as AxiosError<ApiResponse<unknown>>;
		const errorMessage =
			axiosError.response?.data?.message ||
			axiosError.response?.data?.error ||
			axiosError.message ||
			defaultMessage;

		const customError = new Error(errorMessage) as ApiError;
		customError.status = axiosError.response?.status || 500;
		customError.statusText =
			axiosError.response?.statusText || "Internal Server Error";
		throw customError;
	}

	throw error;
};

// ==================== Order APIs ====================

export const getClientOrders = async (
	clientId?: string,
	branchId?: string,
	status?: OrderStatus
): Promise<ApiResponse<Order[]>> => {
	try {
		const params = new URLSearchParams();
		if (clientId) params.append("clientId", clientId);
		if (branchId) params.append("branchId", branchId);
		if (status) params.append("status", status);

		// Backend response type (before normalization)
		interface BackendOrdersResponse {
			status: boolean;
			message?: string;
			data?: Order[];
		}

		const response = await axios.get<BackendOrdersResponse>(
			`${BASE_URL}/orders?${params.toString()}`,
			{ headers: getAuthHeaders() }
		);

		// Normalize backend response: convert "status" to "success"
		const backendResponse = response.data;
		return {
			success: backendResponse.status === true,
			message: backendResponse.message,
			data: backendResponse.data || [],
		};
	} catch (error) {
		return handleApiError(error, "Failed to fetch orders");
	}
};

export const getOrderById = async (
	orderId: string
): Promise<ApiResponse<Order>> => {
	try {
		// Backend response type (before normalization)
		interface BackendOrderResponse {
			status: boolean;
			message?: string;
			data?: Order;
		}

		const response = await axios.get<BackendOrderResponse>(
			`${BASE_URL}/orders/${orderId}`,
			{
				headers: getAuthHeaders(),
			}
		);

		// Normalize backend response: convert "status" to "success"
		const backendResponse = response.data;
		return {
			success: backendResponse.status === true,
			message: backendResponse.message,
			data: backendResponse.data,
		};
	} catch (error) {
		return handleApiError(error, "Failed to fetch order");
	}
};

export const getOrderItemsByOrderId = async (
	orderId: string
): Promise<ApiResponse<OrderItem[]>> => {
	try {
		const response = await axios.get<ApiResponse<OrderItem[]>>(
			`${BASE_URL}/order-items/order/${orderId}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch order items");
	}
};

// Backward compatibility alias
export const getClientOrderById = getOrderById;

export const updateOrder = async (
	orderId: string,
	data: {
		status?: OrderStatus;
		totalPrice?: number;
		clientId?: string;
		branchId?: string;
	}
): Promise<ApiResponse<Order>> => {
	try {
		const response = await axios.put<ApiResponse<Order>>(
			`${BASE_URL}/orders/${orderId}`,
			data,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to update order");
	}
};

export const deleteOrder = async (
	orderId: string
): Promise<ApiResponse<void>> => {
	try {
		const response = await axios.delete<ApiResponse<void>>(
			`${BASE_URL}/orders/${orderId}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to delete order");
	}
};

export const acceptQuote = async (
	orderId: string,
	quoteId: string
): Promise<ApiResponse<Order>> => {
	try {
		const response = await axios.post<ApiResponse<Order>>(
			`${BASE_URL}/orders/${orderId}/accept-quote`,
			{ quoteId },
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to accept quote");
	}
};

export const rejectQuote = async (
	orderId: string,
	quoteId: string
): Promise<ApiResponse<void>> => {
	try {
		const response = await axios.post<ApiResponse<void>>(
			`${BASE_URL}/orders/${orderId}/reject-quote`,
			{ quoteId },
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to reject quote");
	}
};

// ==================== Order Item APIs ====================

export const getOrderItems = async (
	orderId?: string
): Promise<ApiResponse<OrderItem[]>> => {
	try {
		const params = orderId ? `?orderId=${orderId}` : "";
		const response = await axios.get<ApiResponse<OrderItem[]>>(
			`${BASE_URL}/order-items${params}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch order items");
	}
};

export const getOrderItemById = async (
	orderItemId: string
): Promise<ApiResponse<OrderItem>> => {
	try {
		const response = await axios.get<ApiResponse<OrderItem>>(
			`${BASE_URL}/order-items/${orderItemId}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch order item");
	}
};

export const updateOrderItem = async (
	orderItemId: string,
	data: Partial<OrderItem>
): Promise<ApiResponse<OrderItem>> => {
	try {
		const response = await axios.put<ApiResponse<OrderItem>>(
			`${BASE_URL}/order-items/${orderItemId}`,
			data,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to update order item");
	}
};

export const deleteOrderItem = async (
	orderItemId: string
): Promise<ApiResponse<void>> => {
	try {
		const response = await axios.delete<ApiResponse<void>>(
			`${BASE_URL}/order-items/${orderItemId}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to delete order item");
	}
};

// ==================== Branch APIs ====================

export const getBranchesNearMe = async (
	latitude: number,
	longitude: number,
	radius?: number
): Promise<ApiResponse<Branch[]>> => {
	try {
		const params = new URLSearchParams({
			latitude: latitude.toString(),
			longitude: longitude.toString(),
		});
		if (radius) params.append("radius", radius.toString());

		const response = await axios.get<ApiResponse<Branch[]>>(
			`${BASE_URL}/branches/nearme?${params.toString()}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch nearby branches");
	}
};

// ==================== Category APIs ====================

export const getCategories = async (): Promise<ApiResponse<Category[]>> => {
	try {
		const response = await axios.get<ApiResponse<Category[]>>(
			`${BASE_URL}/categories`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch categories");
	}
};

// ==================== SubCategory APIs ====================

export const getSubCategories = async (
	categoryId: string
): Promise<ApiResponse<SubCategory[]>> => {
	try {
		const response = await axios.get<ApiResponse<SubCategory[]>>(
			`${BASE_URL}/sub-categories?categoryId=${categoryId}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch subcategories");
	}
};

// ==================== Service Template APIs ====================

export const getServiceTemplates = async (
	subCategoryId: string,
	branchId?: string
): Promise<ApiResponse<ServiceTemplate[]>> => {
	try {
		const params = new URLSearchParams({ subCategoryId });
		if (branchId) params.append("branchId", branchId);
		
		const response = await axios.get<ApiResponse<ServiceTemplate[]>>(
			`${BASE_URL}/service-templates?${params.toString()}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch service templates");
	}
};

// ==================== Agent Service APIs ====================

export const getAgentServices = async (
	branchId: string,
	serviceTemplateId?: string,
	subCategoryId?: string
): Promise<ApiResponse<AgentService[]>> => {
	try {
		const params = new URLSearchParams({ branchId });
		if (serviceTemplateId) params.append("serviceTemplateId", serviceTemplateId);
		if (subCategoryId) params.append("subCategoryId", subCategoryId);
		const response = await axios.get<ApiResponse<AgentService[]>>(
			`${BASE_URL}/agent-services?${params.toString()}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to fetch agent services");
	}
};

// ==================== File Upload APIs ====================

export const uploadFile = async (
	file: File,
	folder?: string
): Promise<ApiResponse<FileInfo>> => {
	try {
		const formData = new FormData();
		formData.append("file", file);
		if (folder) formData.append("folder", folder);

		const token = localStorage.getItem("token");
		const headers: Record<string, string> = {};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await axios.post<ApiResponse<FileInfo>>(
			`${BASE_URL}/upload`,
			formData,
			{ headers }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to upload file");
	}
};

export const uploadMultipleFiles = async (
	files: File[],
	folder?: string
): Promise<ApiResponse<FileInfo[]>> => {
	try {
		const formData = new FormData();
		files.forEach((file) => {
			formData.append("files", file);
		});
		if (folder) formData.append("folder", folder);

		const token = localStorage.getItem("token");
		const headers: Record<string, string> = {};
		if (token) {
			headers["Authorization"] = `Bearer ${token}`;
		}

		const response = await axios.post<ApiResponse<FileInfo[]>>(
			`${BASE_URL}/upload/multiple`,
			formData,
			{ headers }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to upload files");
	}
};

export const deleteFile = async (
	publicId: string,
	resourceType?: "image" | "video" | "raw" | "auto"
): Promise<ApiResponse<void>> => {
	try {
		const params = resourceType ? `?resource_type=${resourceType}` : "";
		const response = await axios.delete<ApiResponse<void>>(
			`${BASE_URL}/upload/${publicId}${params}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to delete file");
	}
};

// ==================== Ordering on the new pricing ====================

export type FulfilmentType = "delivery" | "pickup";

/** Delivery or pickup, and a phone to reach the customer on */
export interface Delivery {
	fulfilment: FulfilmentType;
	address?: string;
	latitude?: number;
	longitude?: number;
	recipientPhone?: string;
}

/** Ready when there's a phone, plus a pinned address for delivery */
export const deliveryReady = (d: Delivery | null | undefined) =>
	!!d?.recipientPhone?.trim() &&
	(d.fulfilment === "pickup" || (!!d.address && d.latitude != null && d.longitude != null));

export const deliveryFields = (d: Delivery) => ({
	fulfilmentType: d.fulfilment,
	deliveryAddress: d.fulfilment === "delivery" ? d.address : undefined,
	deliveryLatitude: d.fulfilment === "delivery" ? d.latitude : undefined,
	deliveryLongitude: d.fulfilment === "delivery" ? d.longitude : undefined,
	recipientPhone: d.recipientPhone,
});

/** One item, as the server prices it: choices, a custom size in mm, document pages */
export interface PricedItemPayload {
	measurementUnit: MeasurementUnit;
	quantity: number;
	choices: Record<string, string | string[]>;
	size?: { widthMm: number; heightMm: number };
	pages?: number;
	options?: { filePages?: number; files?: FileInfo[] };
}

/** The service template's name and unit, for the configurator */
export interface ServiceTemplateOrderDetails {
	id: string;
	name: string;
	measurementUnit: MeasurementUnit;
}

export const getServiceTemplateOrderDetails = async (
	serviceTemplateId: string
): Promise<ServiceTemplateOrderDetails> => {
	try {
		const response = await axios.get<ApiResponse<ServiceTemplateOrderDetails>>(
			`${BASE_URL}/service-templates/${serviceTemplateId}/order-details`,
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Service not found");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't load this service");
	}
};

/**
 * Order from Printdecore's catalogue. The server prices every item and picks
 * the branch nearest the customer (or the delivery address); ops confirms,
 * then sends a quotation to pay. Nothing is charged now.
 */
export const createProvisionalOrder = async (input: {
	clientId: string;
	items: Array<PricedItemPayload & { serviceTemplateId: string }>;
	comment?: string;
	coords?: { latitude: number; longitude: number };
	delivery: Delivery;
}): Promise<Order> => {
	try {
		const response = await axios.post<ApiResponse<Order>>(
			`${BASE_URL}/orders/provisional`,
			{
				clientId: input.clientId,
				items: input.items,
				comment: input.comment,
				...deliveryFields(input.delivery),
				...(input.coords ? { latitude: input.coords.latitude, longitude: input.coords.longitude } : {}),
			},
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't place the order");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't place the order");
	}
};

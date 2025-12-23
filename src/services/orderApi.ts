import axios, { AxiosError } from 'axios';
import type { ApiError, ApiResponse } from "./api";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// ==================== Types & Interfaces ====================

export type OrderStatus =
	| "PENDING"
	| "QUOTED"
	| "PAID"
	| "IN_PROGRESS"
	| "COMPLETED";

export type MeasurementUnit = "FEET" | "INCH" | "UNIT";

export interface Order {
	id: string;
	clientId: string;
	branchId: string;
	status: OrderStatus;
	totalPrice: number;
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
		[key: string]: unknown;
	};
	calculatedPrice: number;
	createdAt: string;
	updatedAt: string;
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
	name: string;
	measurementUnit: MeasurementUnit;
	description?: string;
	allowsCustomSize: boolean;
	supportsFrontBack: boolean;
	supportsColor: boolean;
	supportsPrintCut: boolean;
	pricingFormulaId: string;
	createdAt: string;
	updatedAt: string;
}

export interface AgentService {
	id: string;
	branchId: string;
	serviceTemplateId: string;
	pricePerUnit?: number;
	constant?: number;
	colorPriceModifier?: number; // Fixed amount to add when color option is selected
	isActive: boolean;
	supportsPrintCut: boolean;
	supportsColor: boolean;
	supportsFrontBack: boolean;
	supportsFrontOnly: boolean;
	formulaType?: string; // Pricing formula type from service template (e.g., "PAGE_BASED", "AREA_FEET")
	createdAt: string;
	updatedAt: string;
}

export interface PriceCalculationRequest {
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options?: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
		filePages?: number; // Number of pages in PDF (for PAGE_BASED pricing)
		numberOfPages?: number; // Alternative name for filePages
		[key: string]: unknown;
	};
}

export interface PriceCalculationResponse {
	calculatedPrice: number;
	basePrice: number;
	formulaType: string;
	agentService: {
		id: string;
		pricePerUnit?: number;
		constant?: number;
	};
}

// ==================== Helper Functions ====================

const getAuthHeaders = () => {
	const token = localStorage.getItem("token");
	return {
		"Content-Type": "application/json",
		...(token && { Authorization: `Bearer ${token}` }),
	};
};

const handleApiError = (error: unknown, defaultMessage: string): never => {
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

export const createOrder = async (
	clientId: string,
	branchId: string,
	paymentReference: string,
	totalPrice: number
): Promise<ApiResponse<Order>> => {
	try {
		const response = await axios.post<ApiResponse<Order>>(
			`${BASE_URL}/orders`,
			{ clientId, branchId, paymentReference, totalPrice },
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to create order");
	}
};

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

		const response = await axios.get<any>(
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
		const response = await axios.get<any>(
			`${BASE_URL}/orders/${orderId}`,
			{ headers: getAuthHeaders() }
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
			`${BASE_URL}/order-items?orderId=${orderId}`,
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

export const calculatePrice = async (
	agentServiceId: string,
	calculationData: PriceCalculationRequest
): Promise<ApiResponse<PriceCalculationResponse>> => {
	try {
		// Clean up the request payload - remove undefined values
		const cleanPayload: PriceCalculationRequest = {
			measurementUnit: calculationData.measurementUnit,
			quantity: calculationData.quantity,
		};

		// Only include width/height if they are defined and valid
		if (
			calculationData.width !== undefined &&
			calculationData.width !== null &&
			calculationData.width > 0
		) {
			cleanPayload.width = calculationData.width;
		}
		if (
			calculationData.height !== undefined &&
			calculationData.height !== null &&
			calculationData.height > 0
		) {
			cleanPayload.height = calculationData.height;
		}

		// Include options if they exist and have content
		if (
			calculationData.options &&
			Object.keys(calculationData.options).length > 0
		) {
			cleanPayload.options = calculationData.options;
		}

		const response = await axios.post<ApiResponse<PriceCalculationResponse>>(
			`${BASE_URL}/orders/calculate-price?agentServiceId=${agentServiceId}`,
			cleanPayload,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to calculate price");
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

export const createOrderItem = async (orderItemData: {
	orderId: string;
	agentServiceId: string;
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options?: OrderItem["options"];
	calculatedPrice: number;
}): Promise<ApiResponse<OrderItem>> => {
	try {
		const response = await axios.post<ApiResponse<OrderItem>>(
			`${BASE_URL}/order-items`,
			orderItemData,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to create order item");
	}
};

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
	subCategoryId: string
): Promise<ApiResponse<ServiceTemplate[]>> => {
	try {
		const response = await axios.get<ApiResponse<ServiceTemplate[]>>(
			`${BASE_URL}/service-templates?subCategoryId=${subCategoryId}`,
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
	serviceTemplateId: string
): Promise<ApiResponse<AgentService[]>> => {
	try {
		const response = await axios.get<ApiResponse<AgentService[]>>(
			`${BASE_URL}/agent-services?branchId=${branchId}&serviceTemplateId=${serviceTemplateId}`,
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

// ==================== Category Search APIs ====================

export interface SearchFilters {
	query?: string;
	categoryId?: string;
	subCategoryId?: string;
	pricingType?: "AREA_BASED" | "UNIT_BASED" | "MIXED" | "CUSTOM_QUOTE";
	minPrice?: number;
	maxPrice?: number;
	priceForQuantity?: number;
	priceForWidth?: number;
	priceForHeight?: number;
	priceMeasurementUnit?: MeasurementUnit;
	latitude?: number;
	longitude?: number;
	radiusKm?: number;
	branchId?: string;
	supportsColor?: boolean;
	supportsFrontBack?: boolean;
	supportsFrontOnly?: boolean;
	supportsPrintCut?: boolean;
	allowsCustomSize?: boolean;
	isActive?: boolean;
	page?: number;
	limit?: number;
	sortBy?: "name" | "price" | "createdAt" | "popularity";
	sortOrder?: "asc" | "desc";
}

export interface SearchResult {
	id: string;
	type: "service";
	category: {
		id: string;
		name: string;
		imageUrl?: string;
	};
	subCategory: {
		id: string;
		name: string;
		imageUrl?: string;
		pricingType: "AREA_BASED" | "UNIT_BASED" | "MIXED" | "CUSTOM_QUOTE";
	};
	service: {
		id: string;
		name: string;
		measurementUnit: MeasurementUnit;
		allowsCustomSize: boolean;
		supportsFrontBack: boolean;
		supportsColor: boolean;
		supportsPrintCut: boolean;
		supportsFrontOnly: boolean;
	};
	branches?: Array<{
		id: string;
		branchId: string;
		branchName: string;
		pricePerUnit?: number;
		constant?: number;
		isActive: boolean;
		location?: {
			address: string;
			latitude: number;
			longitude: number;
		};
		distance?: number;
	}>;
	priceRange?: {
		min: number;
		max: number;
		currency: string;
	};
	estimatedPrice?: number;
}

export interface SearchResponse {
	results: SearchResult[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
	filters: SearchFilters;
	aggregations: {
		categories: Array<{
			id: string;
			name: string;
			count: number;
		}>;
		pricingTypes: Array<{
			type: string;
			count: number;
		}>;
		priceRange: {
			min: number;
			max: number;
		};
	};
}

export interface SearchSuggestions {
	categories: Array<{
		id: string;
		name: string;
		imageUrl?: string;
	}>;
	subCategories: Array<{
		id: string;
		name: string;
		imageUrl?: string;
		categoryId: string;
		categoryName: string;
	}>;
	services: Array<{
		id: string;
		name: string;
		subCategoryId: string;
		subCategoryName: string;
		categoryName: string;
	}>;
}

export const searchCategories = async (
	filters: SearchFilters
): Promise<ApiResponse<SearchResponse>> => {
	try {
		const params = new URLSearchParams();

		Object.entries(filters).forEach(([key, value]) => {
			if (value !== undefined && value !== null && value !== "") {
				params.append(key, String(value));
			}
		});

		const response = await axios.get<ApiResponse<SearchResponse>>(
			`${BASE_URL}/category-search?${params.toString()}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to search categories");
	}
};

export const getSearchSuggestions = async (
	query: string
): Promise<ApiResponse<SearchSuggestions>> => {
	try {
		if (query.length < 2) {
			return {
				success: true,
				data: {
					categories: [],
					subCategories: [],
					services: [],
				},
			};
		}

		const response = await axios.get<ApiResponse<SearchSuggestions>>(
			`${BASE_URL}/category-search/suggestions?query=${encodeURIComponent(
				query
			)}`,
			{ headers: getAuthHeaders() }
		);
		return response.data;
	} catch (error) {
		return handleApiError(error, "Failed to get search suggestions");
	}
};

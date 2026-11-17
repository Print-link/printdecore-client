import axios from "axios";
import type { ApiResponse } from "./api";
import { BASE_URL, deliveryFields, getAuthHeaders, handleApiError, type Delivery, type FileInfo, type OrderStatus } from "./orderApi";
import type { Choices } from "./pricingApi";

/** A Print Assistant request: one job, priced on the new pricing or quoted by the team */
export interface PrintRequest {
	id: string;
	requestNumber: string;
	orderId: string;
	categoryId?: string;
	subCategoryId?: string;
	serviceTemplateId?: string;
	quantity?: number;
	choices?: Choices;
	pages?: number;
	filePages?: number;
	additionalDetails?: string;
	attachments: FileInfo[];
	calculatedPrice?: number;
	fulfilmentType?: "delivery" | "pickup";
	deliveryAddress?: string;
	recipientPhone?: string;
	createdAt: string;
	categoryName?: string;
	subCategoryName?: string;
	serviceName?: string;
	orderStatus?: OrderStatus;
	orderTotalPrice?: number;
	conversationId?: string;
}

export interface CreatePrintRequestInput {
	categoryId: string;
	subCategoryId?: string;
	serviceTemplateId?: string;
	quantity?: number;
	/** What the customer chose, by option key */
	choices?: Choices;
	/** A custom size, in mm */
	size?: { widthMm: number; heightMm: number };
	/** Pages in the document, for products priced by the page */
	pages?: number;
	additionalDetails?: string;
	attachments?: FileInfo[];
	coords?: { latitude: number; longitude: number };
	delivery: Delivery;
}

export const createPrintRequest = async (input: CreatePrintRequestInput): Promise<PrintRequest> => {
	try {
		const { delivery, coords, ...rest } = input;
		// A delivered job is produced near its destination; a pickup near the customer
		const near = delivery.fulfilment === "delivery" ? { latitude: delivery.latitude, longitude: delivery.longitude } : coords;
		const response = await axios.post<ApiResponse<PrintRequest>>(
			`${BASE_URL}/print-requests`,
			{ ...rest, ...deliveryFields(delivery), ...(near ?? {}) },
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't send your request");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't send your request");
	}
};

export const getMyPrintRequests = async (): Promise<PrintRequest[]> => {
	try {
		const response = await axios.get<ApiResponse<PrintRequest[]>>(`${BASE_URL}/print-requests`, { headers: getAuthHeaders() });
		return response.data.data ?? [];
	} catch (error) {
		return handleApiError(error, "Couldn't load your requests");
	}
};

export const getPrintRequest = async (id: string): Promise<PrintRequest> => {
	try {
		const response = await axios.get<ApiResponse<PrintRequest>>(`${BASE_URL}/print-requests/${id}`, { headers: getAuthHeaders() });
		if (!response.data.data) throw new Error(response.data.message || "Request not found");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't load this request");
	}
};

export interface RequestMessage {
	id: string;
	senderType: string;
	body?: string;
	attachments?: FileInfo[];
	/** "quote": a price the team sent, paid from the order */
	cardType?: string;
	cardPayload?: { quotationId?: string; amount?: number; status?: string };
	createdAt: string;
}

export const getRequestMessages = async (id: string): Promise<RequestMessage[]> => {
	try {
		const response = await axios.get<ApiResponse<RequestMessage[]>>(`${BASE_URL}/print-requests/${id}/messages`, {
			headers: getAuthHeaders(),
		});
		return response.data.data ?? [];
	} catch (error) {
		return handleApiError(error, "Couldn't load messages");
	}
};

export const sendRequestMessage = async (id: string, body: string): Promise<RequestMessage> => {
	try {
		const response = await axios.post<ApiResponse<RequestMessage>>(
			`${BASE_URL}/print-requests/${id}/messages`,
			{ body },
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't send");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't send your message");
	}
};

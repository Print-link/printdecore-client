import axios from "axios";
import type { ApiResponse } from "./api";
import { BASE_URL, getAuthHeaders, handleApiError } from "./orderApi";

export type QuotationStatus = "PENDING" | "SENT" | "ACCEPTED" | "REJECTED";

/** The price Printdecore confirms for an order, which the customer accepts and pays */
export interface Quotation {
	id: string;
	orderId: string;
	kind: "standard" | "complex";
	amount?: number;
	status: QuotationStatus;
	sentAt?: string;
	createdAt: string;
	updatedAt?: string;
}

export const getQuotationsForOrder = async (orderId: string): Promise<Quotation[]> => {
	try {
		const response = await axios.get<ApiResponse<Quotation[]>>(`${BASE_URL}/quotations`, {
			params: { orderId },
			headers: getAuthHeaders(),
		});
		return response.data.data ?? [];
	} catch (error) {
		return handleApiError(error, "Couldn't load the quotation");
	}
};

/** Accept a price, or decline it — with an optional reason the shop sees */
export const respondToQuotation = async (quotationId: string, accepted: boolean, reason?: string): Promise<Quotation | undefined> => {
	try {
		const response = await axios.patch<ApiResponse<Quotation>>(
			`${BASE_URL}/quotations/${quotationId}/respond`,
			{ accepted, ...(reason?.trim() && { reason: reason.trim() }) },
			{ headers: getAuthHeaders() }
		);
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't respond to the quotation");
	}
};

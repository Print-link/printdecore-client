import axios from "axios";
import type { ApiResponse } from "./api";
import { BASE_URL, deliveryFields, getAuthHeaders, handleApiError, type Delivery, type FileInfo } from "./orderApi";
import type { Choices } from "./pricingApi";
import type { PrintRequest } from "./printRequestApi";

/** A file in the chat, as the server keeps it */
export interface AgentFile {
	url: string;
	name: string;
	type?: string;
	size?: number;
}

export type AgentMessage =
	| { role: "customer"; text: string; attachments: AgentFile[]; at: string }
	| { role: "agent"; text: string; at: string };

/** The order the assistant put together, waiting for the customer's Confirm */
export interface AgentDraft {
	version: number;
	/** A custom request: a job we don't list, quoted by the Printdecore team */
	custom?: boolean;
	/** Absent on a custom request */
	productId?: string;
	/** The service's name, or a custom request's title */
	serviceName: string;
	quantity: number;
	choices: Choices;
	pages?: number;
	attachments: AgentFile[];
	notes?: string;
	fulfilment?: { type: "pickup" | "delivery"; address?: string; recipientPhone?: string };
	/** null: priced by quotation */
	price: { currency: string; total: number; lines: { label: string; detail?: string; amount: number }[] } | null;
	/** The shop needs the customer's file; the card asks for it before sending */
	fileRequired?: boolean;
	/** What to attach, e.g. "Your 12-page document" */
	fileNeeded?: string;
	summary: string[];
	savedAt: string;
	/** Set once it was confirmed */
	printRequestId?: string;
}

export type AgentConversationStatus = "active" | "needs_staff" | "submitted" | "closed";

export interface AgentConversation {
	id: string;
	status: AgentConversationStatus;
	/** The shop the chat was started for (its page); null on the Printdecore-wide assistant */
	branchId?: string | null;
	draft: AgentDraft | null;
	printRequestId: string | null;
	messages: AgentMessage[];
	createdAt: string;
	updatedAt: string;
}

export interface AgentReply {
	/** null while a staff member has the conversation */
	reply: string | null;
	waitingForStaff: boolean;
	conversation: AgentConversation;
}

type Coords = { latitude: number; longitude: number };

const url = (path: string) => `${BASE_URL}/print-agent${path}`;

/** branchId: a chat started on that shop's page — its requests go to that shop for a quote */
export const startAgentConversation = async (coords?: Coords, branchId?: string): Promise<AgentConversation> => {
	try {
		const response = await axios.post<ApiResponse<AgentConversation>>(
			url("/conversations"),
			{ channel: "web", ...coords, ...(branchId && { branchId }) },
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't start the assistant");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't start the assistant");
	}
};

export const getAgentConversation = async (id: string): Promise<AgentConversation> => {
	try {
		const response = await axios.get<ApiResponse<AgentConversation>>(url(`/conversations/${id}`), { headers: getAuthHeaders() });
		if (!response.data.data) throw new Error(response.data.message || "Conversation not found");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't load the conversation");
	}
};

export const sendAgentMessage = async (id: string, input: { text: string; attachments?: FileInfo[]; coords?: Coords }): Promise<AgentReply> => {
	try {
		const response = await axios.post<ApiResponse<AgentReply>>(
			url(`/conversations/${id}/messages`),
			{
				text: input.text,
				attachments: input.attachments?.map((f) => ({ url: f.url, name: f.name, type: f.type, size: f.size })),
				...input.coords,
			},
			// The assistant may look things up several times before it answers
			{ headers: getAuthHeaders(), timeout: 180_000 }
		);
		if (!response.data.data) throw new Error(response.data.message || "The assistant didn't answer");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "The assistant didn't answer");
	}
};

export interface ConfirmedDraft {
	printRequest: PrintRequest;
	instantPrice: boolean;
	conversation: AgentConversation;
}

export const confirmAgentDraft = async (id: string, draftVersion: number, delivery: Delivery, files: FileInfo[] = []): Promise<ConfirmedDraft> => {
	try {
		const response = await axios.post<ApiResponse<ConfirmedDraft>>(
			url(`/conversations/${id}/confirm`),
			{
				draftVersion,
				...deliveryFields(delivery),
				// Files attached on the card itself
				...(files.length && { attachments: files.map((f) => ({ url: f.url, name: f.name, type: f.type, size: f.size })) }),
			},
			{ headers: getAuthHeaders() }
		);
		if (!response.data.data) throw new Error(response.data.message || "Couldn't send your order");
		return response.data.data;
	} catch (error) {
		return handleApiError(error, "Couldn't send your order");
	}
};

/** Most files one message can carry, and the largest one the server takes */
export const MAX_AGENT_FILES = 10;
export const MAX_AGENT_FILE_BYTES = 25 * 1024 * 1024;

/** Upload artwork or reference files in any format (not programs) for the chat */
export const uploadPrintFiles = async (files: File[]): Promise<ApiResponse<FileInfo[]>> => {
	try {
		const formData = new FormData();
		files.forEach((file) => formData.append("files", file));
		// Only the token: the browser sets the multipart Content-Type (with its boundary) itself
		const token = localStorage.getItem("token");
		const response = await axios.post<ApiResponse<FileInfo[]>>(`${BASE_URL}/upload/print-files`, formData, {
			headers: token ? { Authorization: `Bearer ${token}` } : {},
			timeout: 300_000,
		});
		return response.data;
	} catch (error) {
		return handleApiError(error, "Couldn't upload your files");
	}
};

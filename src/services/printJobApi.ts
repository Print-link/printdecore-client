import axios from "axios";
import { BASE_URL } from "./orderApi";

const getToken = (): string | null => {
	return localStorage.getItem("token");
};

/**
 * Submit results checker form (no file upload, JSON payload)
 */
export const submitResultsChecker = async (
	data: {
		categoryId: string;
		adminId: string;
		indexNumber: string;
		yearOfCompletion: string;
		dateOfBirth?: string;
		categoryType: string;
		clientId: string;
	}
) => {
	const token = getToken();
	const headers: Record<string, string> = {
		"Content-Type": "application/json",
	};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const payload: {
		categoryId: string;
		adminId: string;
		indexNumber: string;
		yearOfCompletion: string;
		dateOfBirth?: string;
		categoryType: string;
		quantity: string;
	} = {
		categoryId: data.categoryId,
		adminId: data.adminId,
		indexNumber: data.indexNumber,
		yearOfCompletion: data.yearOfCompletion,
		categoryType: data.categoryType,
		quantity: "1",
	};

	// Only include dateOfBirth if provided
	if (data.dateOfBirth && data.dateOfBirth.trim()) {
		payload.dateOfBirth = data.dateOfBirth.trim();
	}

	const response = await axios.post(
		`${BASE_URL}/print/submit/client/${data.clientId}`,
		payload,
		{ headers }
	);

	return response.data;
};

/**
 * Submit format category print job (with file upload, FormData)
 */
export const submitFormatPrintJob = async (
	formData: FormData,
	clientId: string
) => {
	const token = getToken();
	const headers: Record<string, string> = {};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await axios.post(
		`${BASE_URL}/print/submit/client/${clientId}`,
		formData,
		{
			headers,
			// Don't set Content-Type - axios will set it with boundary for FormData
		}
	);

	return response.data;
};

/**
 * Submit regular print job (with file upload, FormData)
 */
export const submitRegularPrintJob = async (
	formData: FormData,
	clientId: string
) => {
	const token = getToken();
	const headers: Record<string, string> = {};
	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await axios.post(
		`${BASE_URL}/print/submit/client/${clientId}`,
		formData,
		{
			headers,
			// Don't set Content-Type - axios will set it with boundary for FormData
		}
	);

	return response.data;
};


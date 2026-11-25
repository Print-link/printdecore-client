import axios from "axios";
import type { ApiResponse } from "./api";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

/** A wide promo card on Home. Admins manage these on the admin dashboard. */
export interface PromoBanner {
	id: string;
	headline: string;
	subline: string | null;
	imageUrl: string | null;
	/** #RRGGBB behind the text */
	backgroundColor: string;
	/** An app path ("/home/shops/…") or an http(s) URL */
	linkUrl: string;
}

/** The banners that are live now, in the admin's order. Empty if the request fails: promos are never worth an error. */
export const listPromoBanners = async (): Promise<PromoBanner[]> => {
	try {
		const response = await axios.get<ApiResponse<PromoBanner[]>>(`${BASE_URL}/promo-banners`);
		return response.data.data ?? [];
	} catch {
		return [];
	}
};

export interface PrintStation {
	_id: string;
	id?: string;
	name: string;
	email: string;
	businessName: string;
	businessPhone: string;
	businessCoverImage: string;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
	};
	distance?: number;
}

export interface UserLocation {
	latitude: number;
	longitude: number;
}

export type LocationPermission = "prompt" | "granted" | "denied";


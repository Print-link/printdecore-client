import { createContext } from "react";

export interface User {
	_id: string;
	email: string;
	fullName: string;
	phoneNumber: string;
	isActive: boolean;
	lastLogin?: string;
}

export interface AuthContextType {
	user: User | null;
	login: (
		email: string,
		password: string
	) => Promise<{ success: boolean; message?: string }>;
	register: (
		fullName: string,
		email: string,
		password: string,
		phoneNumber: string
	) => Promise<{ success: boolean; message?: string }>;
	logout: () => void;
	isLoading: boolean;
	refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


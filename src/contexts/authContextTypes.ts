import { createContext } from "react";

export interface User {
	_id: string;
	email: string;
	firstName: string;
	lastName: string;
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
		firstName: string,
		lastName: string,
		email: string,
		password: string,
		phoneNumber: string
	) => Promise<{ success: boolean; message?: string }>;
	logout: () => void;
	isLoading: boolean;
	refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);


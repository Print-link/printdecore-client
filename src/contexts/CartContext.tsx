import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { AgentService, PriceCalculationResponse, FileInfo } from "../services/orderApi";

export interface CartItem {
	id: string; // Temporary ID for cart item
	agentServiceId: string;
	serviceTemplateId: string;
	branchId: string;
	serviceName?: string;
	width?: number;
	height?: number;
	measurementUnit: "FEET" | "INCH" | "UNIT";
	quantity: number;
	options: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
		filePages?: number;
		numberOfPages?: number;
		[key: string]: unknown;
	};
	files: File[]; // File objects stored in memory (not uploaded yet)
	calculatedPrice: number;
	priceInfo?: PriceCalculationResponse;
	agentService?: AgentService;
}

interface CartContextType {
	cart: CartItem[];
	branchId: string | null;
	addToCart: (item: CartItem) => void;
	removeFromCart: (itemId: string) => void;
	updateCartItem: (itemId: string, updates: Partial<CartItem>) => void;
	clearCart: () => void;
	getCartTotal: () => number;
	getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "piper_cart";
const BRANCH_STORAGE_KEY = "piper_cart_branch";

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [cart, setCart] = useState<CartItem[]>([]);
	const [branchId, setBranchId] = useState<string | null>(null);

	// Load cart from localStorage on mount
	useEffect(() => {
		try {
			const savedCart = localStorage.getItem(CART_STORAGE_KEY);
			const savedBranchId = localStorage.getItem(BRANCH_STORAGE_KEY);
			
			if (savedCart) {
				// Note: File objects can't be stored in localStorage
				// We'll need to handle this differently - store file metadata only
				const parsedCart = JSON.parse(savedCart);
				// Files will be empty after reload, user will need to re-select
				setCart(parsedCart.map((item: Omit<CartItem, "files"> & { files: never[] }) => ({
					...item,
					files: [], // Files can't be persisted
				})));
			}
			
			if (savedBranchId) {
				setBranchId(savedBranchId);
			}
		} catch (error) {
			console.error("Error loading cart from localStorage:", error);
		}
	}, []);

	// Save cart to localStorage (without files)
	useEffect(() => {
		try {
			const cartWithoutFiles = cart.map(({ files, ...item }) => item);
			localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartWithoutFiles));
		} catch (error) {
			console.error("Error saving cart to localStorage:", error);
		}
	}, [cart]);

	// Save branchId to localStorage
	useEffect(() => {
		if (branchId) {
			localStorage.setItem(BRANCH_STORAGE_KEY, branchId);
		} else {
			localStorage.removeItem(BRANCH_STORAGE_KEY);
		}
	}, [branchId]);

	const addToCart = (item: CartItem) => {
		// Set branchId if not set
		if (!branchId && item.branchId) {
			setBranchId(item.branchId);
		}
		
		// Check if branch matches
		if (branchId && item.branchId !== branchId) {
			throw new Error("Cannot add items from different branches. Please clear your cart first.");
		}

		setCart((prev) => [...prev, item]);
	};

	const removeFromCart = (itemId: string) => {
		setCart((prev) => prev.filter((item) => item.id !== itemId));
	};

	const updateCartItem = (itemId: string, updates: Partial<CartItem>) => {
		setCart((prev) =>
			prev.map((item) =>
				item.id === itemId ? { ...item, ...updates } : item
			)
		);
	};

	const clearCart = () => {
		setCart([]);
		setBranchId(null);
		localStorage.removeItem(CART_STORAGE_KEY);
		localStorage.removeItem(BRANCH_STORAGE_KEY);
	};

	const getCartTotal = () => {
		return cart.reduce((total, item) => total + item.calculatedPrice, 0);
	};

	const getCartItemCount = () => {
		return cart.length;
	};

	return (
		<CartContext.Provider
			value={{
				cart,
				branchId,
				addToCart,
				removeFromCart,
				updateCartItem,
				clearCart,
				getCartTotal,
				getCartItemCount,
			}}
		>
			{children}
		</CartContext.Provider>
	);
};

export const useCart = () => {
	const context = useContext(CartContext);
	if (context === undefined) {
		throw new Error("useCart must be used within a CartProvider");
	}
	return context;
};


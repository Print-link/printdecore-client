import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Delivery, FileInfo, MeasurementUnit } from "../services/orderApi";
import type { Choices } from "../services/pricingApi";

/** One product in the tray, set up and priced by the server */
export interface CartItem {
	id: string;
	serviceTemplateId: string;
	/** Set when ordering from a shop: that shop's listing of the product */
	agentServiceId?: string;
	serviceName: string;
	measurementUnit: MeasurementUnit;
	quantity: number;
	choices: Choices;
	size?: { widthMm: number; heightMm: number };
	pages?: number;
	/** Already uploaded, so the tray survives a reload */
	files: FileInfo[];
	summaryLines: string[];
	calculatedPrice: number;
}

/** A shop the customer chose (marketplace). null: Printdecore handles it. */
export interface CartVendor {
	id: string;
	name: string;
}

interface CartContextType {
	cart: CartItem[];
	vendor: CartVendor | null;
	comment: string;
	delivery: Delivery | null;
	setComment: (comment: string) => void;
	setDelivery: (delivery: Delivery | null) => void;
	/** Adds to the tray; a different shop (or Printdecore) replaces what was there — ask first with cartTargetClash */
	addToCart: (item: CartItem, vendor: CartVendor | null) => void;
	removeFromCart: (itemId: string) => void;
	clearCart: () => void;
	getCartTotal: () => number;
	getCartItemCount: () => number;
	/** The tray holds items for a different shop (or Printdecore) than `vendor` */
	cartTargetClash: (vendor: CartVendor | null) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// v2: items on the new pricing (older trays held the old price fields and are dropped)
const STORAGE_KEY = "printdecore_tray_v2";
const OLD_KEYS = ["piper_cart", "piper_cart_branch", "piper_cart_comment"];

interface Stored {
	cart: CartItem[];
	vendor: CartVendor | null;
	comment: string;
	delivery: Delivery | null;
}

const load = (): Stored => {
	const empty: Stored = { cart: [], vendor: null, comment: "", delivery: null };
	try {
		OLD_KEYS.forEach((k) => localStorage.removeItem(k));
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? { ...empty, ...JSON.parse(raw) } : empty;
	} catch {
		return empty;
	}
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
	const [state, setState] = useState<Stored>(load);

	useEffect(() => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// Storage full or blocked: the tray still works for this visit
		}
	}, [state]);

	const sameTarget = (a: CartVendor | null, b: CartVendor | null) => (a?.id ?? null) === (b?.id ?? null);

	const value: CartContextType = {
		cart: state.cart,
		vendor: state.vendor,
		comment: state.comment,
		delivery: state.delivery,
		setComment: (comment) => setState((s) => ({ ...s, comment })),
		setDelivery: (delivery) => setState((s) => ({ ...s, delivery })),
		addToCart: (item, vendor) =>
			setState((s) => {
				// A different shop (or Printdecore) starts a new tray
				const keep = s.cart.length && sameTarget(s.vendor, vendor) ? s.cart : [];
				return { ...s, cart: [...keep, item], vendor };
			}),
		removeFromCart: (itemId) =>
			setState((s) => {
				const cart = s.cart.filter((i) => i.id !== itemId);
				return { ...s, cart, vendor: cart.length ? s.vendor : null };
			}),
		clearCart: () => setState((s) => ({ ...s, cart: [], vendor: null, comment: "" })),
		getCartTotal: () => state.cart.reduce((sum, i) => sum + i.calculatedPrice, 0),
		getCartItemCount: () => state.cart.length,
		cartTargetClash: (vendor) => state.cart.length > 0 && !sameTarget(state.vendor, vendor),
	};

	return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useCart = () => {
	const context = useContext(CartContext);
	if (!context) throw new Error("useCart must be used within a CartProvider");
	return context;
};

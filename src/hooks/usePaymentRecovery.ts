import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { recoverPayments } from "../services/paystackService";
import { useCart } from "../contexts/CartContext";
import { useAuth } from "./useAuth";

/**
 * App-level hook that checks for payments completed outside the app.
 * Runs once per session when a logged-in user enters the app.
 * If a recovered order is found, clears the cart and redirects.
 */
export function usePaymentRecovery() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const { clearCart } = useCart();
	const hasCheckedRef = useRef(false);

	useEffect(() => {
		if (!user?._id || hasCheckedRef.current) return;
		hasCheckedRef.current = true;

		const check = async () => {
			try {
				const recovered = await recoverPayments();
				const completed = recovered.find(
					(r) => r.status === "recovered" && r.orderId,
				);
				if (completed?.orderId) {
					clearCart();
					toast.success(
						"Your previous payment was completed successfully! Redirecting to your order.",
					);
					setTimeout(() => {
						navigate(`/home/order/${completed.orderId}`);
					}, 1500);
				}
			} catch {
				// Non-blocking
			}
		};
		check();
	}, [user?._id, clearCart, navigate]);
}

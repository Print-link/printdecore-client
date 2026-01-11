import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, CheckCircle, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../contexts/CartContext";
import {
	createOrder,
	createOrderItem,
	uploadMultipleFiles,
} from "../services/orderApi";
import type { FileInfo } from "../services/orderApi";
import { getBranchById } from "../services/branches.service";
import { PaymentModal } from "../components/PaymentModal";

export const Checkout = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { cart, clearCart, getCartTotal, comment } = useCart();
	const queryClient = useQueryClient();

	const [isProcessing, setIsProcessing] = useState(false);
	const [currentStep, setCurrentStep] = useState<string>("");
	const [orderId, setOrderId] = useState<string | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [branch, setBranch] = useState<{
		payStackSubAccountId?: string;
	} | null>(null);
	const [loadingBranch, setLoadingBranch] = useState(false);

	useEffect(() => {
		const fetchBranch = async () => {
			if (!branchId) return;
			setLoadingBranch(true);
			try {
				const response = await getBranchById(branchId);
				if (response.success && response.data) {
					setBranch(response.data);
				}
			} catch (error) {
				console.error("Error fetching branch:", error);
				toast.error("Failed to load branch information");
			} finally {
				setLoadingBranch(false);
			}
		};
		fetchBranch();
	}, [branchId]);

	const getSubtotal = () => {
		return getCartTotal();
	};

	const getTransactionFee = () => {
		return Math.round(getCartTotal() * 0.015 * 100) / 100;
	};

	const getTotalWithFee = () => {
		const subtotal = getCartTotal();
		const fee = Math.round(subtotal * 0.015 * 100) / 100;
		return Math.round((subtotal + fee) * 100) / 100;
	};

	const handlePlaceOrder = () => {
		if (!user?._id || !branchId) {
			toast.error("User authentication or branch information is missing");
			return;
		}

		if (cart.length === 0) {
			toast.error("Cart is empty");
			return;
		}

		if (!branch?.payStackSubAccountId) {
			toast.error("Branch payment information is not configured");
			return;
		}

		setShowPaymentModal(true);
	};

	const handlePaymentSuccess = async (paymentData: {
		reference: string;
		amount: number;
	}) => {
		if (!user?._id || !branchId || !paymentData.reference) {
			toast.error("Payment verification failed");
			return;
		}

		setShowPaymentModal(false);
		setIsProcessing(true);

		try {
			setCurrentStep("Creating order with verified payment...");
			// Send base price (without transaction fee) to store in order
			// Payment was made with totalWithFee, but order total excludes the transaction fee
			const basePrice = getSubtotal();
			const orderResponse = await createOrder(
				user._id,
				branchId,
				paymentData.reference,
				basePrice,
				comment || undefined
			);

			if (!orderResponse.success || !orderResponse.data) {
				throw new Error(orderResponse.message || "Failed to create order");
			}

			const order = orderResponse.data;
			setOrderId(order.id);

			for (let i = 0; i < cart.length; i++) {
				const item = cart[i];
				setCurrentStep(`Processing item ${i + 1} of ${cart.length}...`);

				let uploadedFiles: FileInfo[] = [];
				if (item.files.length > 0) {
					setCurrentStep(`Uploading files for item ${i + 1}...`);
					const uploadResponse = await uploadMultipleFiles(
						item.files,
						`orders/${order.id}/items/temp`
					);

					if (uploadResponse.success && uploadResponse.data) {
						uploadedFiles = uploadResponse.data.map((file) => ({
							url: file.url,
							publicId: file.publicId,
							name: file.name,
							size: file.size,
							type: file.type,
							width: file.width,
							height: file.height,
							format: file.format,
							bytes: file.bytes,
						}));
					} else {
						console.warn(
							`Failed to upload files for item ${i + 1}, continuing...`
						);
					}
				}

				setCurrentStep(`Creating order item ${i + 1}...`);
				const orderItemResponse = await createOrderItem({
					orderId: order.id,
					agentServiceId: item.agentServiceId,
					// New flexible pricing fields
					selectedBaseConfigId: item.selectedBaseConfigId,
					selectedOptions: item.selectedOptions,
					selectedCustomSpecs: item.selectedCustomSpecs,
					// Legacy fields
					width: item.width,
					height: item.height,
					measurementUnit: item.measurementUnit,
					quantity: item.quantity,
					options: {
						// Include new flexible config in options for reference
						selectedBaseConfigId: item.selectedBaseConfigId,
						selectedOptions: item.selectedOptions,
						selectedCustomSpecs: item.selectedCustomSpecs,
						// Legacy options
						...item.options,
						// File URLs
						files: uploadedFiles,
					},
					calculatedPrice: item.calculatedPrice,
				});

				if (!orderItemResponse.success) {
					console.warn(`Failed to create order item ${i + 1}, continuing...`);
				}
			}

			clearCart();
			toast.success("Cart cleared successfully");

			if (user?._id) {
				queryClient.invalidateQueries({ queryKey: ["orders", user._id] });
				queryClient.invalidateQueries({ queryKey: ["order", order.id] });
			}

			setCurrentStep("Order placed successfully!");
			toast.success("Order placed successfully!");

			setTimeout(() => {
				navigate(`/home/order/${order.id}`);
			}, 1500);
		} catch (error) {
			console.error("Error placing order:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to place order. Please try again.";
			toast.error(errorMessage);

			if (orderId) {
				toast.info(
					"Order was created but some items failed. You can retry or cancel the order."
				);
			}
		} finally {
			setIsProcessing(false);
			setCurrentStep("");
		}
	};

	const handlePaymentError = (error: string) => {
		toast.error(error);
		setShowPaymentModal(false);
	};

	if (cart.length === 0) {
		return (
			<div className="w-full max-w-6xl mx-auto">
				<button
					onClick={() => navigate(-1)}
					className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>
				<div className="bg-white rounded-xl p-8 text-center border border-gray-300">
					<AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Cart is Empty
					</h2>
					<p className="text-gray-600 mb-4">
						Add items to your cart before checkout
					</p>
					<button
						onClick={() => navigate(-1)}
						className="px-4 py-2 bg-[#fbbf24] text-white rounded-lg hover:bg-[#fbbf24]"
					>
						Go to Cart
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto">
			<div className="mb-4">
				<button
					onClick={() => navigate(-1)}
					className="mb-3 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Checkout
				</h1>
				<p className="text-sm text-gray-600">Review your order and place it</p>
			</div>

			<div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-4">
				<h2 className="text-lg font-semibold text-gray-900 mb-3">
					Order Summary
				</h2>
				<div className="space-y-2 mb-3">
					{cart.map((item) => (
						<div key={item.id} className="flex justify-between text-sm">
							<span className="text-gray-600">
								{item.quantity}x Service Item
								{item.files.length > 0 &&
									` (${item.files.length} file${
										item.files.length > 1 ? "s" : ""
									})`}
							</span>
							<span className="font-medium">
								GHS {item.calculatedPrice.toFixed(2)}
							</span>
						</div>
					))}
				</div>
				<div className="pt-4 border-t border-gray-200 space-y-2">
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-700">Subtotal</span>
						<span className="text-base font-semibold text-gray-900">
							GHS {getSubtotal().toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-sm font-medium text-gray-700">
							Transaction Fee (1.5%)
						</span>
						<span className="text-base font-semibold text-gray-900">
							GHS {getTransactionFee().toFixed(2)}
						</span>
					</div>
					<div className="pt-2 border-t border-gray-200 flex justify-between items-center">
						<span className="text-lg font-semibold text-gray-900">Total</span>
						<span className="text-2xl font-bold text-[#fbbf24]">
							GHS {getTotalWithFee().toFixed(2)}
						</span>
					</div>
				</div>
			</div>

			{isProcessing && (
				<div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 mb-6">
					<div className="flex items-center gap-3">
						<Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
						<span className="text-sm text-blue-900">{currentStep}</span>
					</div>
				</div>
			)}

			<div className="flex flex-col md:flex-row gap-4">
				<button
					onClick={() => navigate(-1)}
					disabled={isProcessing || showPaymentModal}
					className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 transition-all"
				>
					Cancel
				</button>
				<button
					onClick={handlePlaceOrder}
					disabled={
						isProcessing ||
						!user ||
						loadingBranch ||
						!branch?.payStackSubAccountId
					}
					className="flex-1 px-4 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
				>
					{isProcessing ? (
						<>
							<Loader2 className="w-4 h-4 animate-spin" />
							Processing...
						</>
					) : (
						<>
							<CheckCircle className="w-4 h-4" />
							Place Order
						</>
					)}
				</button>
			</div>

			{showPaymentModal && branch?.payStackSubAccountId && user?.email && (
				<PaymentModal
					isOpen={showPaymentModal}
					onClose={() => setShowPaymentModal(false)}
					amount={getTotalWithFee()}
					email={user.email}
					subaccount={branch.payStackSubAccountId}
					onPaymentSuccess={handlePaymentSuccess}
					onPaymentError={handlePaymentError}
				/>
			)}
		</div>
	);
};

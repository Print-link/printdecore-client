import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CreditCard } from "lucide-react";
import { toast } from "react-toastify";
import { useCart } from "../contexts/CartContext";
import { EmptyState } from "../components/EmptyState";

export const Cart = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const navigate = useNavigate();
	const { cart, removeFromCart, updateCartItem, getCartTotal, clearCart } = useCart();

	const handleRemoveItem = (itemId: string) => {
		removeFromCart(itemId);
		toast.success("Item removed from cart");
	};

	const handleQuantityChange = (itemId: string, newQuantity: number) => {
		if (newQuantity < 1) {
			toast.error("Quantity must be at least 1");
			return;
		}
		updateCartItem(itemId, { quantity: newQuantity });
		// Note: Price would need to be recalculated, but for now we'll keep the original price
		// In a full implementation, you'd want to recalculate price when quantity changes
	};

	const handleCheckout = () => {
		if (cart.length === 0) {
			toast.error("Cart is empty");
			return;
		}
		navigate(`/order/checkout/${branchId}`);
	};

	const handleContinueShopping = () => {
		navigate(-1);
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
				<EmptyState
					icon={<ShoppingCart className="w-16 h-16 text-gray-400" />}
					title="Your cart is empty"
					description="Add items to your cart to get started"
					actionLabel="Continue Shopping"
					onAction={handleContinueShopping}
				/>
			</div>
		);
	}

	return (
		<div className="w-full max-w-6xl mx-auto">
			{/* Header */}
			<div className="mb-4">
				<button
					onClick={() => navigate(-1)}
					className="mb-3 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Shopping Cart
				</h1>
				<p className="text-sm text-gray-600">
					Review your items before checkout
				</p>
			</div>

			{/* Cart Items */}
			<div className="bg-white rounded-lg border-2 border-gray-200 divide-y-2 divide-gray-200">
				{cart.map((item) => (
					<div key={item.id} className="p-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-900 mb-2">
									{item.agentService?.serviceTemplateId || "Service"}
								</h3>
								
								{/* Item Details */}
								<div className="space-y-1 text-sm text-gray-600 mb-3">
									{item.width && item.height && (
										<div>
											Dimensions: {item.width} × {item.height} {item.measurementUnit}
										</div>
									)}
									<div>Quantity: {item.quantity}</div>
									{item.options.frontBack && (
										<div className="text-[#fbbf24]">✓ Front & Back</div>
									)}
									{item.options.color && (
										<div className="text-[#fbbf24]">✓ Color Printing</div>
									)}
									{item.options.printCut && (
										<div className="text-[#fbbf24]">✓ Print & Cut</div>
									)}
									{item.options.filePages && (
										<div>PDF Pages: {item.options.filePages}</div>
									)}
									{item.files.length > 0 && (
										<div>Files: {item.files.length} file(s)</div>
									)}
								</div>

								{/* Quantity Controls */}
								<div className="flex items-center gap-2">
									<label className="text-sm font-semibold text-gray-700">Quantity:</label>
									<button
										onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
										className="p-1.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
									>
										<Minus className="w-4 h-4" />
									</button>
									<span className="w-12 text-center font-semibold">{item.quantity}</span>
									<button
										onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
										className="p-1.5 border-2 border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all"
									>
										<Plus className="w-4 h-4" />
									</button>
								</div>
							</div>

							<div className="ml-6 flex flex-col items-end">
								<div className="text-2xl font-bold text-[#fbbf24] mb-4">
									GHS {item.calculatedPrice.toFixed(2)}
								</div>
								<button
									onClick={() => handleRemoveItem(item.id)}
									className="text-red-600 hover:text-red-700 flex items-center gap-1 text-sm"
								>
									<Trash2 className="w-4 h-4" />
									Remove
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Cart Summary */}
			<div className="mt-6 bg-white rounded-lg border-2 border-gray-200 p-6">
				<div className="flex justify-between items-center mb-4">
					<span className="text-lg font-semibold text-gray-900">Total</span>
					<span className="text-3xl font-bold text-[#fbbf24]">
						GHS {getCartTotal().toFixed(2)}
					</span>
				</div>
				<div className="flex gap-4">
					<button
						onClick={handleContinueShopping}
						className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
					>
						Continue Shopping
					</button>
					<button
						onClick={handleCheckout}
						className="flex-1 px-4 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] flex items-center justify-center gap-2 transition-all"
					>
						<CreditCard className="w-4 h-4" />
						Proceed to Checkout
					</button>
				</div>
			</div>
		</div>
	);
};


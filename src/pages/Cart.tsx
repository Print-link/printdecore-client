import { useParams, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash, Plus, Minus, ArrowLeft, CreditCard } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useCart } from "../contexts/CartContext";
import { EmptyState } from "../components/EmptyState";

export const Cart = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const navigate = useNavigate();
	const { cart, removeFromCart, updateCartItem, getCartTotal, comment, setComment } = useCart();

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
		navigate(`/home/order/checkout/${branchId}`);
	};

	const handleContinueShopping = () => {
		navigate(-1);
	};

	if (cart.length === 0) {
		return (
			<div className="w-full max-w-6xl mx-auto">
				<button
					onClick={() => navigate(-1)}
					className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft size={16} weight="bold" className="mr-2" />
					Back
				</button>
				<EmptyState
					icon={<ShoppingCart size={64} weight="duotone" className="text-gray-400 dark:text-gray-500" />}
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
					className="mb-3 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft size={16} weight="bold" className="mr-2" />
					Back
				</button>
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">
					Shopping Cart
				</h1>
				<p className="text-sm text-gray-600 dark:text-gray-400">
					Review your items before checkout
				</p>
			</div>

			{/* Cart Items */}
			<div className="bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 divide-y-2 divide-gray-200 dark:divide-gray-700">
				{cart.map((item) => (
					<div key={item.id} className="p-4">
						<div className="flex items-start justify-between">
							<div className="flex-1">
								<h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
									{item.agentService?.serviceTemplateId || "Service"}
								</h3>

								{/* Item Details */}
								<div className="space-y-1 text-sm text-gray-600 dark:text-gray-400 mb-3">
									{item.width && item.height && (
										<div>
											Dimensions: {item.width} × {item.height}{" "}
											{item.measurementUnit}
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
									<label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
										Quantity:
									</label>
									<button
										onClick={() =>
											handleQuantityChange(item.id, item.quantity - 1)
										}
										className="p-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
									>
										<Minus size={16} weight="bold" />
									</button>
									<span className="w-12 text-center font-semibold">
										{item.quantity}
									</span>
									<button
										onClick={() =>
											handleQuantityChange(item.id, item.quantity + 1)
										}
										className="p-1.5 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
									>
										<Plus size={16} weight="bold" />
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
									<Trash size={16} weight="bold" />
									Remove
								</button>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Comment Section */}
			<div className="mt-6 bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
				<label className="block text-base font-semibold text-gray-900 dark:text-white mb-2">
					Order Comment (Optional)
				</label>
				<textarea
					value={comment}
					onChange={(e) => setComment(e.target.value)}
					placeholder="Add any special instructions or comments for your order..."
					rows={4}
					className="w-full px-4 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent transition-all resize-y"
				/>
			</div>

			{/* Cart Summary */}
			<div className="mt-6 bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 p-6">
				<div className="space-y-3 mb-6">
					<div className="flex justify-between items-center">
						<span className="text-base font-medium text-gray-700 dark:text-gray-300">
							Subtotal
						</span>
						<span className="text-lg font-semibold text-gray-900 dark:text-white">
							GHS {getCartTotal().toFixed(2)}
						</span>
					</div>
					<div className="flex justify-between items-center">
						<span className="text-base font-medium text-gray-700 dark:text-gray-300">
							Transaction Fee
						</span>
						<span className="text-lg font-semibold text-gray-900 dark:text-white">
							GHS {(getCartTotal() * 0.0195).toFixed(2)}
						</span>
					</div>
					<div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 flex justify-between items-center">
						<span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
						<span className="text-3xl font-bold text-[#fbbf24]">
							GHS {(getCartTotal() * 1.015).toFixed(2)}
						</span>
					</div>
				</div>
				<div className="flex gap-4 flex-col md:flex-row">
					<button
						onClick={handleContinueShopping}
						className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all"
					>
						Continue Shopping
					</button>
					<button
						onClick={handleCheckout}
						className="flex-1 px-4 py-3 bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] flex items-center justify-center gap-2 transition-all"
					>
						<CreditCard size={16} weight="bold" />
						Proceed to Checkout
					</button>
				</div>
			</div>
		</div>
	);
};


import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	Loader2,
	AlertCircle,
	ArrowLeft,
	ShoppingCart,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAgentService } from "../hooks/useAgentService";
import { usePdfPageCount } from "../hooks/usePdfPageCount";
import { useOrderPriceCalculation } from "../hooks/useOrderPriceCalculation";
import { validateOrderForm } from "../utils/orderValidation";
import { useCart } from "../contexts/CartContext";
import { FileUploadSection } from "../components/order/FileUploadSection";
import { DimensionsInput } from "../components/order/DimensionsInput";
import { OrderOptions } from "../components/order/OrderOptions";
import { BaseConfigurationSelector } from "../components/order/BaseConfigurationSelector";
import { CustomSpecificationsSelector } from "../components/order/CustomSpecificationsSelector";
import { PricePreview } from "../components/order/PricePreview";
import { AddToCartModal } from "../components/order/AddToCartModal";
import type { MeasurementUnit } from "../services/orderApi";
import {
	hasFlexiblePricing,
	getDefaultBaseConfig,
	getDefaultOptions,
} from "../utils/pricingUtils";

interface OrderFormData {
	// New flexible pricing format
	selectedBaseConfigId?: string;
	selectedOptions?: string[];
	selectedCustomSpecs?: string[];

	// Legacy format (for backward compatibility)
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
	};
	description?: string; // For CUSTOM_QUOTE
}

export const OrderForm = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const [searchParams] = useSearchParams();
	const agentServiceId = searchParams.get("agentServiceId");
	const serviceTemplateId = searchParams.get("serviceTemplateId");
	const navigate = useNavigate();
	const POPULAR_BASE_CONFIG_ID = "a4";

	// Custom hooks
	const { agentService, loading, error } = useAgentService(
		agentServiceId,
		branchId,
		serviceTemplateId
	);

	const [formData, setFormData] = useState<OrderFormData>({
		measurementUnit: "FEET",
		quantity: 1,
		options: {
			frontBack: false,
			color: false,
			printCut: false,
			frontOnly: false,
		},
	});

	const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
	const [showAddToCartModal, setShowAddToCartModal] = useState(false);
	const [quantityInput, setQuantityInput] = useState<string>("1");

	// Cart context
	const { addToCart, branchId: cartBranchId, clearCart, cart } = useCart();

	// PDF page counting
	const { pdfPageCount, countingPages, setPdfPageCount } =
		usePdfPageCount(selectedFiles);

	// Update form data with page count when it changes
	useEffect(() => {
		setFormData((prev) => ({
			...prev,
			options: {
				...prev.options,
				filePages: pdfPageCount,
				numberOfPages: pdfPageCount,
			},
		}));
	}, [pdfPageCount]);

	// Price calculation
	const { priceInfo, calculatingPrice, formulaType, usesFlexiblePricing } =
		useOrderPriceCalculation({
			agentServiceId,
			formData: {
				...formData,
				options: {
					...formData.options,
					filePages: pdfPageCount,
					numberOfPages: pdfPageCount,
				},
			},
			agentService,
			pdfPageCount,
		});

	// Sync quantity input with formData.quantity on initial load
	useEffect(() => {
		setQuantityInput(formData.quantity.toString());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // Only run on mount

	// Initialize default values for flexible pricing when agentService loads
	useEffect(() => {
		if (
			agentService &&
			hasFlexiblePricing(agentService) &&
			agentService.pricingConfig
		) {
			setFormData((prev) => {
				// 👇 if user already selected something, DO NOT override
				if (prev.selectedBaseConfigId) {
					return prev;
				}

				const baseConfigs =
					agentService.pricingConfig?.baseConfigurations || [];

				// 👇 Prefer A4 if it exists
				const popularExists = baseConfigs.some(
					(c) => c.id === POPULAR_BASE_CONFIG_ID
				);

				const defaultBaseConfig = popularExists
					? POPULAR_BASE_CONFIG_ID
					: getDefaultBaseConfig(agentService.pricingConfig || null);

				return {
					...prev,
					selectedBaseConfigId: defaultBaseConfig || undefined,
					selectedOptions:
						prev.selectedOptions ||
						getDefaultOptions(agentService.pricingConfig || null),
					selectedCustomSpecs: prev.selectedCustomSpecs || [],
				};
			});
		}
	}, [agentService]);

	// Check if this is a PAGE_BASED service (Bond Paper) - use agentService.formulaType directly
	// This ensures isPageBased is available regardless of configuration sequence
	const isPageBased =
		agentService?.formulaType === "PAGE_BASED" ||
		formulaType === "PAGE_BASED" ||
		priceInfo?.formulaType === "PAGE_BASED";

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || []);

		// For PAGE_BASED (Bond Paper), only allow PDF files
		if (isPageBased) {
			const nonPdfFiles = files.filter(
				(file) =>
					file.type !== "application/pdf" &&
					!file.name?.toLowerCase().endsWith(".pdf")
			);
			if (nonPdfFiles.length > 0) {
				toast.error("Only PDF files are allowed for this service");
				return;
			}
		}

		setSelectedFiles((prev) => [...prev, ...files]);
	};

	const handleFileRemove = (index: number) => {
		setSelectedFiles((prev) => {
			const newFiles = prev.filter((_, i) => i !== index);
			if (
				prev[index] &&
				(prev[index].type === "application/pdf" ||
					prev[index].name?.toLowerCase().endsWith(".pdf"))
			) {
				setPdfPageCount(undefined);
			}
			return newFiles;
		});
	};

	const handleAddToCart = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form
		if (
			!validateOrderForm({
				priceInfo,
				selectedFiles,
				pdfPageCount,
				width: formData.width,
				height: formData.height,
				agentService,
				selectedBaseConfigId: formData.selectedBaseConfigId,
			})
		) {
			return;
		}

		if (!priceInfo || !agentService) {
			toast.error("Price calculation is required. Please wait...");
			return;
		}

		if (cart.length > 0 && cartBranchId && cartBranchId !== branchId) {
			toast.error(
				"Cannot add items from different branches. Please clear your cart first."
			);
			return;
		}

		// Show modal instead of directly adding
		setShowAddToCartModal(true);
	};

	const handleConfirmAddToCart = () => {
		if (!priceInfo || !agentService) return;

		try {
			// Add to cart (files stay as File objects in memory - no upload yet)
			const cartItem = {
				id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				agentServiceId: agentServiceId!,
				serviceTemplateId: serviceTemplateId!,
				branchId: branchId!,
				// New flexible pricing fields
				selectedBaseConfigId: formData.selectedBaseConfigId,
				selectedOptions: formData.selectedOptions,
				selectedCustomSpecs: formData.selectedCustomSpecs,
				// Legacy fields
				width: formData.width,
				height: formData.height,
				measurementUnit: formData.measurementUnit,
				quantity: formData.quantity,
				options: {
					...formData.options,
					filePages: pdfPageCount,
					numberOfPages: pdfPageCount,
				},
				files: selectedFiles, // File objects stored in memory
				calculatedPrice: priceInfo.calculatedPrice,
				priceInfo,
				agentService,
			};

			addToCart(cartItem);
			setShowAddToCartModal(false);
			toast.success("Item added to cart!");
			navigate(`/home/order/cart/${branchId}`); // Go to cart
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to add item to cart";

			// If it's a branch conflict error, offer to clear cart
			if (errorMessage.includes("different branches")) {
				toast.error(
					<div>
						<p className="mb-2">{errorMessage}</p>
						<button
							onClick={() => {
								clearCart();
								toast.success(
									"Cart cleared. You can now add items from this branch."
								);
								// Retry adding to cart after clearing
								setTimeout(() => {
									try {
										if (!priceInfo || !agentService) return;
										const retryCartItem = {
											id: `cart-${Date.now()}-${Math.random()
												.toString(36)
												.substr(2, 9)}`,
											agentServiceId: agentServiceId!,
											serviceTemplateId: serviceTemplateId!,
											branchId: branchId!,
											// New flexible pricing fields
											selectedBaseConfigId: formData.selectedBaseConfigId,
											selectedOptions: formData.selectedOptions,
											selectedCustomSpecs: formData.selectedCustomSpecs,
											// Legacy fields
											width: formData.width,
											height: formData.height,
											measurementUnit: formData.measurementUnit,
											quantity: formData.quantity,
											options: {
												...formData.options,
												filePages: pdfPageCount,
												numberOfPages: pdfPageCount,
											},
											files: selectedFiles,
											calculatedPrice: priceInfo.calculatedPrice,
											priceInfo,
											agentService,
										};
										addToCart(retryCartItem);
										setShowAddToCartModal(true);
									} catch {
										toast.error("Failed to add item. Please try again.");
									}
								}, 100);
							}}
							className="text-sm font-semibold text-white bg-[#fbbf24] px-3 py-1 rounded hover:bg-[#d97706] transition-colors"
						>
							Clear Cart & Add Item
						</button>
					</div>,
					{
						autoClose: 10000,
					}
				);
			} else {
				toast.error(errorMessage);
			}
		}
	};

	const handleContinueShopping = () => {
		if (!priceInfo || !agentService) return;

		try {
			// Add to cart (files stay as File objects in memory - no upload yet)
			const cartItem = {
				id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
				agentServiceId: agentServiceId!,
				serviceTemplateId: serviceTemplateId!,
				branchId: branchId!,
				// New flexible pricing fields
				selectedBaseConfigId: formData.selectedBaseConfigId,
				selectedOptions: formData.selectedOptions,
				selectedCustomSpecs: formData.selectedCustomSpecs,
				// Legacy fields
				width: formData.width,
				height: formData.height,
				measurementUnit: formData.measurementUnit,
				quantity: formData.quantity,
				options: {
					...formData.options,
					filePages: pdfPageCount,
					numberOfPages: pdfPageCount,
				},
				files: selectedFiles, // File objects stored in memory
				calculatedPrice: priceInfo.calculatedPrice,
				priceInfo,
				agentService,
			};

			addToCart(cartItem);
			setShowAddToCartModal(false);
			toast.success("Item added to cart!");
			navigate(-1); // Go back to agent services
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : "Failed to add item to cart";

			// If it's a branch conflict error, offer to clear cart
			if (errorMessage.includes("different branches")) {
				toast.error(
					<div>
						<p className="mb-2">{errorMessage}</p>
						<button
							onClick={() => {
								clearCart();
								toast.success(
									"Cart cleared. You can now add items from this branch."
								);
								// Retry adding to cart after clearing
								setTimeout(() => {
									try {
										if (!priceInfo || !agentService) return;
										const retryCartItem = {
											id: `cart-${Date.now()}-${Math.random()
												.toString(36)
												.substr(2, 9)}`,
											agentServiceId: agentServiceId!,
											serviceTemplateId: serviceTemplateId!,
											branchId: branchId!,
											// New flexible pricing fields
											selectedBaseConfigId: formData.selectedBaseConfigId,
											selectedOptions: formData.selectedOptions,
											selectedCustomSpecs: formData.selectedCustomSpecs,
											// Legacy fields
											width: formData.width,
											height: formData.height,
											measurementUnit: formData.measurementUnit,
											quantity: formData.quantity,
											options: {
												...formData.options,
												filePages: pdfPageCount,
												numberOfPages: pdfPageCount,
											},
											files: selectedFiles,
											calculatedPrice: priceInfo.calculatedPrice,
											priceInfo,
											agentService,
										};
										addToCart(retryCartItem);
										setShowAddToCartModal(true);
									} catch {
										toast.error("Failed to add item. Please try again.");
									}
								}, 100);
							}}
							className="text-sm font-semibold text-white bg-[#fbbf24] px-3 py-1 rounded hover:bg-[#d97706] transition-colors"
						>
							Clear Cart & Add Item
						</button>
					</div>,
					{
						autoClose: 10000,
					}
				);
			} else {
				toast.error(errorMessage);
			}
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
				<div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-8">
					<div className="flex items-center justify-center py-8 sm:py-12">
						<Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-[#fbbf24] animate-spin" />
					</div>
				</div>
			</div>
		);
	}

	if (error || !agentService) {
		return (
			<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
				<div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-8">
					<div className="text-center py-8 sm:py-12">
						<AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
							Error
						</h2>
						<p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
							{error || "Agent service not found"}
						</p>
						<button
							onClick={handleBack}
							className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-2.5 text-sm sm:text-base font-medium text-[#fbbf24] hover:text-[#d97706] transition-colors"
						>
							<ArrowLeft className="w-4 h-4 mr-2" />
							Go Back
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="md:w-full md:max-w-4xl md:mx-auto md:px-4 lg:px-0">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 sm:mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Header */}
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
					Configure Your Order
				</h1>
				<p className="text-xs sm:text-sm text-gray-600">
					{isPageBased
						? "Upload your PDF file and configure your order"
						: "Fill in the details and upload your files"}
				</p>
			</div>

			<form
				onSubmit={handleAddToCart}
				className="bg-white rounded-lg p-4 sm:p-5 lg:p-6 border-2 border-gray-200 space-y-4 sm:space-y-6"
			>
				{/* Step 1: Base Configuration (New Flexible Pricing) - Matches PricingConfigForm order */}
				{usesFlexiblePricing && agentService?.pricingConfig && (
					<div className="border-b border-gray-200 pb-4 sm:pb-6">
						<BaseConfigurationSelector
							pricingConfig={agentService.pricingConfig}
							selectedBaseConfigId={formData.selectedBaseConfigId || null}
							onSelect={(configId) =>
								setFormData((prev) => ({
									...prev,
									selectedBaseConfigId: configId,
								}))
							}
							showDimensions={!isPageBased}
							width={formData.width}
							height={formData.height}
							measurementUnit={formData.measurementUnit}
							onWidthChange={(width) =>
								setFormData((prev) => ({ ...prev, width }))
							}
							onHeightChange={(height) =>
								setFormData((prev) => ({ ...prev, height }))
							}
							onMeasurementUnitChange={(unit) =>
								setFormData((prev) => ({ ...prev, measurementUnit: unit }))
							}
						/>
					</div>
				)}

				{/* Step 2: Options (New Flexible Pricing or Legacy) - Matches PricingConfigForm order */}
				{agentService && (
					<div className="border-b border-gray-200 pb-4 sm:pb-6">
						{usesFlexiblePricing ? (
							<OrderOptions
								agentService={agentService}
								selectedOptions={formData.selectedOptions || []}
								onSelectedOptionsChange={(options) =>
									setFormData((prev) => ({ ...prev, selectedOptions: options }))
								}
								isPageBased={isPageBased}
							/>
						) : (
							<OrderOptions
								agentService={agentService}
								options={formData.options}
								onOptionChange={(option, value) =>
									setFormData((prev) => ({
										...prev,
										options: {
											...prev.options,
											[option]: value,
										},
									}))
								}
								isPageBased={isPageBased}
							/>
						)}
					</div>
				)}

				{/* Step 3: Custom Specifications (New Flexible Pricing) - Matches PricingConfigForm order */}
				{usesFlexiblePricing && agentService?.pricingConfig && (
					<div className="border-b border-gray-200 pb-4 sm:pb-6">
						<CustomSpecificationsSelector
							pricingConfig={agentService.pricingConfig}
							selectedCustomSpecs={formData.selectedCustomSpecs || []}
							onToggle={(specId) => {
								setFormData((prev) => {
									const current = prev.selectedCustomSpecs || [];
									if (current.includes(specId)) {
										return {
											...prev,
											selectedCustomSpecs: current.filter(
												(id) => id !== specId
											),
										};
									} else {
										return {
											...prev,
											selectedCustomSpecs: [...current, specId],
										};
									}
								});
							}}
						/>
					</div>
				)}

				{/* Dimensions - Legacy format or for area-based services (after pricing config sections) */}
				{!usesFlexiblePricing && !isPageBased && agentService && (
					<div className="border-b border-gray-200 pb-4 sm:pb-6">
						<DimensionsInput
							width={formData.width}
							height={formData.height}
							measurementUnit={formData.measurementUnit}
							onWidthChange={(width) =>
								setFormData((prev) => ({ ...prev, width }))
							}
							onHeightChange={(height) =>
								setFormData((prev) => ({ ...prev, height }))
							}
							onMeasurementUnitChange={(unit) =>
								setFormData((prev) => ({ ...prev, measurementUnit: unit }))
							}
							required={!isPageBased}
						/>
					</div>
				)}

				{/* Quantity */}
				<div>
					<label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
						Quantity *
					</label>
					<input
						type="number"
						min="1"
						value={quantityInput}
						onChange={(e) => {
							const value = e.target.value;
							// Allow empty string and any numeric input
							setQuantityInput(value);
							const numValue = parseInt(value, 10);
							// Update formData if it's a valid number >= 1, otherwise keep previous value
							if (!isNaN(numValue) && numValue >= 1) {
								setFormData((prev) => ({
									...prev,
									quantity: numValue,
								}));
							}
						}}
						onBlur={(e) => {
							// Ensure minimum value of 1 when input loses focus
							const value = e.target.value;
							const numValue = parseInt(value, 10);
							if (value === "" || isNaN(numValue) || numValue < 1) {
								setQuantityInput("1");
								setFormData((prev) => ({
									...prev,
									quantity: 1,
								}));
							} else {
								// Sync input with formData value
								setQuantityInput(numValue.toString());
							}
						}}
						required
						className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent transition-all"
					/>
				</div>

				{/* File Upload */}
				<FileUploadSection
					selectedFiles={selectedFiles}
					onFileSelect={handleFileSelect}
					onFileRemove={handleFileRemove}
					isPageBased={isPageBased}
					pdfPageCount={pdfPageCount}
					countingPages={countingPages}
				/>

				{/* Price Preview */}
				{priceInfo && agentService && (
					<PricePreview
						priceInfo={priceInfo}
						agentService={agentService}
						isPageBased={isPageBased}
						pdfPageCount={pdfPageCount}
						quantity={formData.quantity}
						options={formData.options}
						calculatingPrice={calculatingPrice}
						selectedBaseConfigId={formData.selectedBaseConfigId}
						selectedOptions={formData.selectedOptions}
						selectedCustomSpecs={formData.selectedCustomSpecs}
					/>
				)}

				{/* Submit Button */}
				<div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2">
					<button
						type="button"
						onClick={handleBack}
						className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={calculatingPrice || !priceInfo}
						className="w-full sm:flex-1 px-4 sm:px-6 py-3 sm:py-3.5 text-sm sm:text-base bg-[#fbbf24] text-white rounded-lg font-semibold hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
					>
						{calculatingPrice ? (
							<>
								<Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
								<span>Calculating...</span>
							</>
						) : (
							<>
								<ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
								<span>Add to Cart</span>
							</>
						)}
					</button>
				</div>
			</form>

			{/* Add to Cart Modal */}
			{priceInfo && agentService && (
				<AddToCartModal
					isOpen={showAddToCartModal}
					onClose={() => setShowAddToCartModal(false)}
					onConfirm={handleConfirmAddToCart}
					onContinueShopping={handleContinueShopping}
					itemDetails={{
						width: formData.width,
						height: formData.height,
						measurementUnit: formData.measurementUnit,
						quantity: formData.quantity,
						options: {
							...formData.options,
							filePages: pdfPageCount,
						},
						filesCount: selectedFiles.length,
						calculatedPrice: priceInfo.calculatedPrice,
						priceInfo,
						agentService,
						isPageBased,
					}}
				/>
			)}
		</div>
	);
};


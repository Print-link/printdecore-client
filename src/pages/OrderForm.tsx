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
import { CalculationBasisSelector } from "../components/order/CalculationBasisSelector";
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
import { getAgentServices, type AgentService } from "../services/orderApi";
import { EmptyState } from "../components/EmptyState";
import { Check } from "lucide-react";

interface OrderFormData {
	calculationBasis?: "INCH" | "FEET";
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
	comment?: string; // Customer comment or special instructions
}

export const OrderForm = () => {
	const { branchId } = useParams<{ branchId: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const agentServiceId = searchParams.get("agentServiceId");
	const serviceTemplateId = searchParams.get("serviceTemplateId");
	const subCategoryId = searchParams.get("subCategoryId");
	const navigate = useNavigate();
	const POPULAR_BASE_CONFIG_ID = "a4";

	// Variant selection state
	const [availableVariants, setAvailableVariants] = useState<AgentService[]>(
		[]
	);
	const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
		agentServiceId
	);
	const [loadingVariants, setLoadingVariants] = useState(false);

	// Custom hook
	const { agentService, loading, error } = useAgentService(
		selectedVariantId,
		branchId,
		null // We use agentServiceId directly now
	);

	const [formData, setFormData] = useState<OrderFormData>({
		calculationBasis: "FEET",
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
	const {
		addToCart,
		branchId: cartBranchId,
		clearCart,
		cart,
		setComment,
	} = useCart();

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
			agentServiceId: selectedVariantId,
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

	// Fetch priced variants for the subcategory
	useEffect(() => {
		const fetchVariants = async () => {
			if (!subCategoryId || !branchId) return;
			setLoadingVariants(true);
			try {
				const response = await getAgentServices(
					branchId,
					undefined,
					subCategoryId
				);
				if (response.success && response.data) {
					// Filter to only show active ones (manager consciously added pricing)
					const pricedVariants = response.data.filter((s) => s.isActive);
					setAvailableVariants(pricedVariants);

					// Auto-select first variant if none selected
					if (!selectedVariantId && pricedVariants.length > 0) {
						setSelectedVariantId(pricedVariants[0].id);
					}
				}
			} catch (err) {
				console.error("Error fetching variants:", err);
			} finally {
				setLoadingVariants(false);
			}
		};
		fetchVariants();
	}, [subCategoryId, branchId]);

	// Initialize default values for flexible pricing when agentService loads
	useEffect(() => {
		if (
			agentService &&
			hasFlexiblePricing(agentService) &&
			agentService.pricingConfig
		) {
			setFormData((prev) => {
				const baseConfigs =
					agentService.pricingConfig?.baseConfigurations || [];

				const popularExists = baseConfigs.some(
					(c) => c.id === POPULAR_BASE_CONFIG_ID
				);

				const defaultBaseConfig = popularExists
					? POPULAR_BASE_CONFIG_ID
					: getDefaultBaseConfig(agentService.pricingConfig || null);

				return {
					...prev,
					selectedBaseConfigId: defaultBaseConfig || undefined,
					selectedOptions: getDefaultOptions(
						agentService.pricingConfig || null
					),
					selectedCustomSpecs: [],
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

	// Check if this service should show calculation basis selector and dimensions
	const shouldShowCalculationBasis =
		agentService?.formulaType === "AREA_OR_UNIT" ||
		agentService?.formulaType === "AREA_FEET" ||
		agentService?.formulaType === "AREA_INCH" ||
		agentService?.formulaType === "AREA_UNIT" ||
		formulaType === "AREA_OR_UNIT" ||
		formulaType === "AREA_FEET" ||
		formulaType === "AREA_INCH" ||
		formulaType === "AREA_UNIT";

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
				agentServiceId: selectedVariantId!,
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
				formulaType: priceInfo?.formulaType,
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
			// Store comment in cart context if provided
			if (formData.comment) {
				setComment(formData.comment);
			}
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
											agentServiceId: selectedVariantId!,
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
											formulaType: priceInfo?.formulaType,
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
				agentServiceId: selectedVariantId!,
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
				formulaType: priceInfo?.formulaType,
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
											agentServiceId: selectedVariantId!,
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
											formulaType: priceInfo?.formulaType,
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

	const handleVariantSelect = (variantId: string) => {
		setSelectedVariantId(variantId);

		// Update URL without navigation
		const newParams = new URLSearchParams(searchParams);
		newParams.set("agentServiceId", variantId);
		// Keep subCategoryId and branchId as they are
		setSearchParams(newParams);

		// Reset form data for new service
		setFormData((prev) => ({
			...prev,
			measurementUnit: "FEET",
			quantity: 1,
			options: {
				frontBack: false,
				color: false,
				printCut: false,
				frontOnly: false,
			},
			selectedBaseConfigId: undefined,
			selectedOptions: [],
			selectedCustomSpecs: [],
		}));
		setSelectedFiles([]);
	};

	if (loadingVariants || (loading && !agentService)) {
		return (
			<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
				<div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-8">
					<div className="flex flex-col items-center justify-center py-8 sm:py-12">
						<Loader2 className="w-8 h-8 text-[#fbbf24] animate-spin mb-4" />
						<p className="text-sm text-gray-500 animate-pulse font-medium">
							{loadingVariants
								? "Loading variants..."
								: "Loading configuration..."}
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (!loadingVariants && availableVariants.length === 0) {
		return (
			<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
				<button
					onClick={handleBack}
					className="mb-4 sm:mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back
				</button>
				<div className="bg-white rounded-2xl p-12 border-2 border-gray-100 flex flex-col items-center">
					<EmptyState type="no-results" />
					<p className="text-gray-500 mt-4 text-center font-medium">
						No active services found for this subcategory.
					</p>
					<p className="text-xs text-gray-400 mt-2 text-center">
						The branch manager needs to configure pricing before this service
						can be ordered.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-0">
				<div className="bg-white rounded-lg sm:rounded-2xl p-6 sm:p-8">
					<div className="text-center py-8 sm:py-12">
						<AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-500 mx-auto mb-3 sm:mb-4" />
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
							Configuration Error
						</h2>
						<p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 px-4">
							{error}
						</p>
						<button
							onClick={handleBack}
							className="inline-flex items-center justify-center px-6 py-2 text-sm font-bold rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
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
		<div className="w-full max-w-4xl mx-auto px-4 lg:px-0">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 sm:mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Variant Selection (Compact) */}
			<div className="mb-6 bg-white rounded-xl border-2 border-amber-100 p-4 shadow-sm overflow-hidden">
				<h2 className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-3">
					Select Service Variant
				</h2>
				<div className="flex overflow-x-auto whitespace-nowrap gap-2 pb-2 scrollbar-hide">
					{availableVariants.map((variant) => (
						<button
							key={variant.id}
							type="button"
							onClick={() => handleVariantSelect(variant.id)}
							className={`px-4 py-2 rounded-lg text-sm font-bold border-2 transition-all flex items-center gap-2 flex-shrink-0 ${
								selectedVariantId === variant.id
									? "bg-amber-50 border-[#fbbf24] text-gray-900 shadow-sm"
									: "bg-white border-gray-100 text-gray-500 hover:border-amber-200"
							}`}
						>
							{selectedVariantId === variant.id && (
								<Check className="w-3.5 h-3.5 text-[#fbbf24] stroke-[3px]" />
							)}
							{variant.serviceName || "Default Variant"}
						</button>
					))}
				</div>
			</div>

			{/* Header */}
			<div className="mb-4 sm:mb-6">
				<h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
					Configure {agentService?.serviceName || "Your Order"}
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

				{/* Calculation Basis Selector and Dimensions for AREA_OR_UNIT, FEET, UNIT formula types */}
				{shouldShowCalculationBasis && agentService && (
					<div className="border-b border-gray-200 pb-4 sm:pb-6 space-y-4">
						<CalculationBasisSelector
							calculationBasis={formData.calculationBasis || "FEET"}
							onCalculationBasisChange={(basis) =>
								setFormData((prev) => ({
									...prev,
									calculationBasis: basis,
									// Also update measurementUnit to match for consistency
									measurementUnit: basis,
								}))
							}
							disabled={calculatingPrice}
						/>

						<DimensionsInput
							width={formData.width}
							height={formData.height}
							measurementUnit={formData.calculationBasis || "FEET"}
							onWidthChange={(width) =>
								setFormData((prev) => ({ ...prev, width }))
							}
							onHeightChange={(height) =>
								setFormData((prev) => ({ ...prev, height }))
							}
							onMeasurementUnitChange={(unit) =>
								setFormData((prev) => ({
									...prev,
									measurementUnit: unit,
									calculationBasis: unit as "INCH" | "FEET",
								}))
							}
							required={true}
						/>
					</div>
				)}

				{/* Dimensions - Legacy format for other non-page-based services */}
				{!usesFlexiblePricing &&
					!isPageBased &&
					!shouldShowCalculationBasis &&
					agentService && (
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

				{/* Comment Field */}
				<div>
					<label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
						Comment (Optional)
					</label>
					<textarea
						value={formData.comment || ""}
						onChange={(e) =>
							setFormData((prev) => ({ ...prev, comment: e.target.value }))
						}
						placeholder="Add any special instructions or comments for this order..."
						rows={4}
						className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fbbf24] focus:border-transparent transition-all resize-y"
					/>
				</div>

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
						width={formData.width}
						height={formData.height}
						calculationBasis={formData.calculationBasis}
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
								<span>Add To Tray</span>
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
						formulaType: priceInfo?.formulaType,
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


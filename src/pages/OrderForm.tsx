import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	SpinnerGap,
	WarningCircle,
	ArrowLeft,
	ShoppingCart,
	Check,
	Minus,
	Plus,
	ChatText,
} from "@phosphor-icons/react";
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
	const { agentService, commissionRate, loading, error } = useAgentService(
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
			commissionRate,
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

	// Track step numbers dynamically
	let stepCounter = 0;
	const nextStep = () => ++stepCounter;

	if (loadingVariants || (loading && !agentService)) {
		return (
			<div className="w-full max-w-5xl mx-auto">
				<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
					<div className="flex flex-col items-center justify-center py-8 sm:py-12">
						<SpinnerGap size={32} className="text-[#fbbf24] animate-spin mb-4" />
						<p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse font-medium">
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
			<div className="w-full max-w-5xl mx-auto">
				<button
					onClick={handleBack}
					className="mb-4 sm:mb-6 inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft size={16} className="mr-2" />
					Back
				</button>
				<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl p-12 border border-gray-100 dark:border-gray-800 flex flex-col items-center">
					<EmptyState type="no-results" />
					<p className="text-gray-500 dark:text-gray-400 mt-4 text-center font-medium">
						No active services found for this subcategory.
					</p>
					<p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
						The branch manager needs to configure pricing before this service
						can be ordered.
					</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="w-full max-w-5xl mx-auto">
				<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
					<div className="text-center py-8 sm:py-12">
						<WarningCircle size={48} className="text-red-500 mx-auto mb-3 sm:mb-4" />
						<h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">
							Configuration Error
						</h2>
						<p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
							{error}
						</p>
						<button
							onClick={handleBack}
							className="inline-flex items-center justify-center px-6 py-2 text-sm font-bold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
						>
							<ArrowLeft size={16} className="mr-2" />
							Go Back
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-5xl mx-auto pb-28 lg:pb-8">
			{/* Breadcrumb Nav */}
			<nav className="mb-4 sm:mb-6 flex items-center gap-2 text-sm">
				<button
					onClick={handleBack}
					className="inline-flex items-center font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft size={16} className="mr-1.5" />
					Back
				</button>
				<span className="text-gray-300 dark:text-gray-600">/</span>
				<span className="font-semibold text-gray-900 dark:text-white truncate">
					{agentService?.serviceName || "Configure Order"}
				</span>
			</nav>

			{/* Variant Selection - only show if more than 1 variant */}
			{availableVariants.length > 1 && (
				<div className="mb-6 flex overflow-x-auto whitespace-nowrap gap-2 pb-1 scrollbar-hide">
					{availableVariants.map((variant) => (
						<button
							key={variant.id}
							type="button"
							onClick={() => handleVariantSelect(variant.id)}
							className={`px-4 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 flex-shrink-0 ${
								selectedVariantId === variant.id
									? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
									: "bg-white border border-gray-200 dark:bg-[#1e1e1e] dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"
							}`}
						>
							{selectedVariantId === variant.id && (
								<Check size={14} weight="bold" />
							)}
							{variant.serviceName || "Default Variant"}
						</button>
					))}
				</div>
			)}

			{/* Two-column layout */}
			<form onSubmit={handleAddToCart}>
				<div className="lg:flex lg:gap-6">
					{/* Left Column - Form Sections */}
					<div className="flex-1 min-w-0 space-y-4">
						{/* Step: Base Configuration (New Flexible Pricing) */}
						{usesFlexiblePricing && agentService?.pricingConfig && (
							<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
										{nextStep()}
									</div>
									<h3 className="text-base font-semibold text-gray-900 dark:text-white">
										Configuration
									</h3>
								</div>
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

						{/* Step: Options */}
						{agentService && (
							<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
										{nextStep()}
									</div>
									<h3 className="text-base font-semibold text-gray-900 dark:text-white">
										Options
									</h3>
								</div>
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

						{/* Step: Custom Specifications */}
						{usesFlexiblePricing && agentService?.pricingConfig && (
							<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
										{nextStep()}
									</div>
									<h3 className="text-base font-semibold text-gray-900 dark:text-white">
										Custom Specifications
									</h3>
								</div>
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

						{/* Step: Calculation Basis & Dimensions */}
						{shouldShowCalculationBasis && agentService && (
							<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
								<div className="flex items-center gap-3 mb-4">
									<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
										{nextStep()}
									</div>
									<h3 className="text-base font-semibold text-gray-900 dark:text-white">
										Dimensions
									</h3>
								</div>
								<div className="space-y-4">
									<CalculationBasisSelector
										calculationBasis={formData.calculationBasis || "FEET"}
										onCalculationBasisChange={(basis) =>
											setFormData((prev) => ({
												...prev,
												calculationBasis: basis,
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
							</div>
						)}

						{/* Step: Dimensions - Legacy */}
						{!usesFlexiblePricing &&
							!isPageBased &&
							!shouldShowCalculationBasis &&
							agentService && (
								<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
									<div className="flex items-center gap-3 mb-4">
										<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
											{nextStep()}
										</div>
										<h3 className="text-base font-semibold text-gray-900 dark:text-white">
											Dimensions
										</h3>
									</div>
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

						{/* Step: Quantity */}
						<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
									{nextStep()}
								</div>
								<h3 className="text-base font-semibold text-gray-900 dark:text-white">
									Quantity
								</h3>
							</div>
							<div className="flex items-center gap-3">
								<button
									type="button"
									onClick={() => {
										const current = parseInt(quantityInput, 10);
										if (!isNaN(current) && current > 1) {
											const newVal = current - 1;
											setQuantityInput(newVal.toString());
											setFormData((prev) => ({ ...prev, quantity: newVal }));
										}
									}}
									className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<Minus size={18} />
								</button>
								<input
									type="text"
									inputMode="numeric"
									value={quantityInput}
									onChange={(e) => {
										const value = e.target.value;
										setQuantityInput(value);
										const numValue = parseInt(value, 10);
										if (!isNaN(numValue) && numValue >= 1) {
											setFormData((prev) => ({
												...prev,
												quantity: numValue,
											}));
										}
									}}
									onBlur={(e) => {
										const value = e.target.value;
										const numValue = parseInt(value, 10);
										if (value === "" || isNaN(numValue) || numValue < 1) {
											setQuantityInput("1");
											setFormData((prev) => ({
												...prev,
												quantity: 1,
											}));
										} else {
											setQuantityInput(numValue.toString());
										}
									}}
									required
									className="w-20 text-center px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all bg-transparent text-gray-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
								/>
								<button
									type="button"
									onClick={() => {
										const current = parseInt(quantityInput, 10);
										const newVal = isNaN(current) ? 1 : current + 1;
										setQuantityInput(newVal.toString());
										setFormData((prev) => ({ ...prev, quantity: newVal }));
									}}
									className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<Plus size={18} />
								</button>
							</div>
						</div>

						{/* Step: File Upload */}
						<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-8 h-8 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-bold flex items-center justify-center">
									{nextStep()}
								</div>
								<h3 className="text-base font-semibold text-gray-900 dark:text-white">
									Upload Files
								</h3>
							</div>
							<FileUploadSection
								selectedFiles={selectedFiles}
								onFileSelect={handleFileSelect}
								onFileRemove={handleFileRemove}
								isPageBased={isPageBased}
								pdfPageCount={pdfPageCount}
								countingPages={countingPages}
							/>
						</div>

						{/* Comment Section */}
						<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
							<div className="flex items-center gap-3 mb-4">
								<div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 flex items-center justify-center">
									<ChatText size={18} />
								</div>
								<h3 className="text-base font-semibold text-gray-900 dark:text-white">
									Comment <span className="text-sm font-normal text-gray-400">(Optional)</span>
								</h3>
							</div>
							<textarea
								value={formData.comment || ""}
								onChange={(e) =>
									setFormData((prev) => ({ ...prev, comment: e.target.value }))
								}
								placeholder="Add any special instructions or comments for this order..."
								rows={3}
								className="w-full px-4 py-3 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-gray-900 dark:focus:ring-white focus:border-transparent transition-all resize-y bg-transparent text-gray-900 dark:text-white placeholder-gray-400"
							/>
						</div>

						{/* Mobile Price Preview (visible below lg) */}
						{priceInfo && agentService && (
							<div className="lg:hidden">
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
							</div>
						)}
					</div>

					{/* Right Column - Sticky Price Summary + CTA (desktop only) */}
					<div className="hidden lg:block w-80 xl:w-96 shrink-0">
						<div className="sticky top-6 space-y-4">
							{/* Price Summary Card */}
							{priceInfo && agentService && (
								<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
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
								</div>
							)}

							{/* Desktop CTA */}
							<button
								type="submit"
								disabled={calculatingPrice || !priceInfo}
								className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
							>
								{calculatingPrice ? (
									<>
										<SpinnerGap size={20} className="animate-spin" />
										<span>Calculating...</span>
									</>
								) : (
									<>
										<ShoppingCart size={20} />
										<span>Add To Tray</span>
										{priceInfo && (
											<span className="ml-1 opacity-75">
												- GHS {priceInfo.calculatedPrice.toFixed(2)}
											</span>
										)}
									</>
								)}
							</button>

							<button
								type="button"
								onClick={handleBack}
								className="w-full py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			</form>

			{/* Mobile Sticky Bottom CTA Bar */}
			<div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-[#1e1e1e] border-t border-gray-200 dark:border-gray-800 z-40 lg:hidden">
				<div className="flex items-center justify-between px-4 py-3">
					<div className="flex flex-col">
						<span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
						<span className="text-lg font-bold text-gray-900 dark:text-white">
							{priceInfo
								? `GHS ${priceInfo.calculatedPrice.toFixed(2)}`
								: "---"}
						</span>
					</div>
					<button
						type="button"
						onClick={handleAddToCart}
						disabled={calculatingPrice || !priceInfo}
						className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-semibold text-sm hover:bg-gray-800 dark:hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all"
					>
						{calculatingPrice ? (
							<>
								<SpinnerGap size={18} className="animate-spin" />
								<span>Calculating...</span>
							</>
						) : (
							<>
								<ShoppingCart size={18} />
								<span>Add To Tray</span>
							</>
						)}
					</button>
				</div>
			</div>

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

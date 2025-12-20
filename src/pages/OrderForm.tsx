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
import { PricePreview } from "../components/order/PricePreview";
import { AddToCartModal } from "../components/order/AddToCartModal";
import type { MeasurementUnit } from "../services/orderApi";

interface OrderFormData {
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

	// Cart context
	const { addToCart, branchId: cartBranchId } = useCart();

	// PDF page counting
	const { pdfPageCount, countingPages, setPdfPageCount } = usePdfPageCount(selectedFiles);

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
	const { priceInfo, calculatingPrice, formulaType } = useOrderPriceCalculation({
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
		selectedFilesLength: selectedFiles.length,
	});

	// Check if this is a PAGE_BASED service (Bond Paper) - use formulaType from hook
	const isPageBased = formulaType === "PAGE_BASED";

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
			// If removing the PDF file, clear page count
			if (prev[index] && (prev[index].type === "application/pdf" || prev[index].name?.toLowerCase().endsWith(".pdf"))) {
				setPdfPageCount(undefined);
			}
			return newFiles;
		});
	};

	const handleAddToCart = async (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form
		if (!validateOrderForm({ priceInfo, selectedFiles, pdfPageCount, width: formData.width, height: formData.height })) {
			return;
		}

		if (!priceInfo || !agentService) {
			toast.error("Price calculation is required. Please wait...");
			return;
		}

		// Check if branch matches cart
		if (cartBranchId && cartBranchId !== branchId) {
			toast.error("Cannot add items from different branches. Please clear your cart first.");
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
			navigate(`/order/cart/${branchId}`); // Go to cart
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart";
			toast.error(errorMessage);
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
			const errorMessage = error instanceof Error ? error.message : "Failed to add item to cart";
			toast.error(errorMessage);
		}
	};

	const handleBack = () => {
		navigate(-1);
	};

	if (loading) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<Loader2 className="w-8 h-8 text-[#63A361] animate-spin" />
				</div>
			</div>
		);
	}

	if (error || !agentService) {
		return (
			<div className="w-full max-w-6xl mx-auto bg-white rounded-2xl p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
					<p className="text-gray-600 mb-4">{error || "Agent service not found"}</p>
					<button
						onClick={handleBack}
						className="inline-flex items-center px-4 py-2 text-sm font-medium text-[#63A361] hover:text-[#63A361]"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Go Back
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-4xl mx-auto">
			{/* Back Button */}
			<button
				onClick={handleBack}
				className="mb-4 inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back
			</button>

			{/* Header */}
			<div className="mb-4">
				<h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
					Configure Your Order
				</h1>
				<p className="text-sm text-gray-600">
					{isPageBased 
						? "Upload your PDF file and configure your order"
						: "Fill in the details and upload your files"}
				</p>
			</div>

			<form onSubmit={handleAddToCart} className="bg-white rounded-lg p-5 border-2 border-gray-200 space-y-4">
				{/* Dimensions - Hide for PAGE_BASED or while determining formula type */}
				{!isPageBased && agentService && formulaType !== null && (
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
				)}

				{/* Quantity */}
				<div>
					<label className="block text-sm font-medium text-gray-700 mb-2">
						Quantity *
					</label>
					<input
						type="number"
						min="1"
						value={formData.quantity}
						onChange={(e) =>
							setFormData((prev) => ({
								...prev,
								quantity: parseInt(e.target.value) || 1,
							}))
						}
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#63A361] focus:border-transparent"
					/>
				</div>

				{/* Options */}
				{agentService && (
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
					/>
				)}

				{/* Submit Button */}
				<div className="flex gap-4">
					<button
						type="button"
						onClick={handleBack}
						className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={calculatingPrice || !priceInfo}
						className="flex-1 px-4 py-3 bg-[#63A361] text-white rounded-lg font-semibold hover:bg-[#5a9458] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all"
					>
						{calculatingPrice ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Calculating...
							</>
						) : (
							<>
								<ShoppingCart className="w-4 h-4 mr-2" />
								Add to Cart
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


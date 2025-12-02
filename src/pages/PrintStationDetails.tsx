import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
	Printer,
	CheckCircle,
	AlertCircle,
	ArrowLeft,
	MapPin,
	ExternalLink,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { getDirectionsUrl } from "../utils/stationUtils";
import { toast } from "react-toastify";
import { bussinessCategoryService } from "../services/bussinessCategoryService";
import type { Category } from "../types/category";
import {
	submitResultsChecker,
	submitFormatPrintJob,
	submitRegularPrintJob,
} from "../services/printJobApi";
import { ResultsCheckerForm } from "../components/forms/ResultsCheckerForm";
import { FormatPrintForm } from "../components/forms/FormatPrintForm";
import { RegularPrintForm } from "../components/forms/RegularPrintForm";
import { countPdfPages, calculateRegularFormatPrice } from "../utils/pdfUtils";
import { getPrintStationById } from "../services/printStation.service";
import { PaymentModal } from "../components/PaymentModal";

interface UploadStatus {
	type: "success" | "error";
	message: string;
}

interface OrderDetails {
	artwork: string;
	width: string;
	height: string;
	quantity: string;
	location: string;
	description: string;
}

interface ResultsCheckerForm {
	indexNumber: string;
	yearOfCompletion: string;
	dateOfBirth?: string; // Only for novdec_result
}

interface PrintStation {
	_id: string;
	id?: string;
	name: string;
	email: string;
	paystackSubaccountCode?: string;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
	};
}

export const PrintStationDetails = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
	const [dragActive, setDragActive] = useState<boolean>(false);
	const [printStation, setPrintStation] = useState<PrintStation | null>(null);
	const [selectedCategory, setSelectedCategory] = useState<Category | null>(
		null
	);
	const [loading, setLoading] = useState<boolean>(true);
	const [orderDetails, setOrderDetails] = useState<OrderDetails>({
		artwork: "",
		width: "",
		height: "",
		quantity: "1",
		location: "",
		description: "",
	});
	const [resultsCheckerForm, setResultsCheckerForm] =
		useState<ResultsCheckerForm>({
			indexNumber: "",
			yearOfCompletion: "",
			dateOfBirth: "",
		});
	const [numberOfCopies, setNumberOfCopies] = useState<string>("1");
	const [pdfPageCount, setPdfPageCount] = useState<number | undefined>(
		undefined
	);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [pendingSubmission, setPendingSubmission] = useState<{
		type: "results" | "format" | "regular";
		data?: unknown;
	} | null>(null);

	const { user } = useAuth();
	const { userLocation } = useGeolocation();

	// Determine category type
	const categoryType = selectedCategory?.categoryType;
	const isResultsChecker =
		categoryType === "wassce_result" ||
		categoryType === "bece_result" ||
		categoryType === "novdec_result";
	const isNovDecResult = categoryType === "novdec_result";
	const isBeceOrWassceResult =
		categoryType === "bece_result" || categoryType === "wassce_result";
	const isLargeFormat = categoryType === "large_format";
	const isRegularFormat = categoryType === "regular_format";
	const isFormatCategory = isLargeFormat || isRegularFormat;

	useEffect(() => {
		const fetchPrintStation = async () => {
			try {
				const response = await getPrintStationById(id || "");
				if (response.data) {
					setPrintStation(response.data?.printStation as PrintStation);
				}
			} catch (error: unknown) {
				console.error("Error fetching print station:", error);
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to load print station details";
				setUploadStatus({ type: "error", message: errorMessage });
			} finally {
				setLoading(false);
			}
		};

		const fetchSelectedCategory = async (categoryId: string) => {
			try {
				const response = await bussinessCategoryService.getCategoryById(
					categoryId
				);
				if (response.success && response.data) {
					setSelectedCategory(response.data);
				}
			} catch (error) {
				console.error("Error fetching category:", error);
			}
		};

		if (id) {
			fetchPrintStation();

			// Fetch selected category if provided in query params
			const categoryId = searchParams.get("category");
			if (categoryId) {
				fetchSelectedCategory(categoryId);
			}
		}
	}, [id, searchParams]);

	// Clear file-related errors when switching to results checker forms (which don't require files)
	useEffect(() => {
		if (isResultsChecker && uploadStatus?.type === "error") {
			// Clear any file-related error messages for results checker forms
			const fileRelatedMessages = [
				"no file",
				"file uploaded",
				"please upload",
				"upload a file",
			];
			const message = uploadStatus.message.toLowerCase();
			const isFileRelatedError = fileRelatedMessages.some((msg) =>
				message.includes(msg)
			);
			if (isFileRelatedError) {
				setUploadStatus(null);
			}
		}
	}, [isResultsChecker, uploadStatus]);

	// Count PDF pages when file is selected for regular_format
	useEffect(() => {
		const countPages = async () => {
			if (
				selectedFile &&
				isRegularFormat &&
				selectedCategory &&
				(selectedFile.type === "application/pdf" ||
					selectedFile.name.toLowerCase().endsWith(".pdf"))
			) {
				try {
					const pages = await countPdfPages(selectedFile);
					setPdfPageCount(pages);
					setUploadStatus(null); // Clear any previous errors
				} catch (error) {
					console.error("Error counting PDF pages:", error);
					setPdfPageCount(undefined);
					setUploadStatus({
						type: "error",
						message:
							"Failed to read PDF file. Please ensure it's a valid PDF and try again.",
					});
				}
			} else {
				// Reset page count if conditions aren't met
				if (!selectedFile || !isRegularFormat) {
					setPdfPageCount(undefined);
				}
			}
		};

		countPages();
	}, [selectedFile, isRegularFormat, selectedCategory]);

	const calculateTotalPrice = (): number | undefined => {
		if (!selectedCategory) return undefined;

		if (isResultsChecker) {
			return selectedCategory.unitPrice;
		}

		// Large format - unitPrice * number of copies
		if (isLargeFormat) {
			const copies = parseInt(numberOfCopies, 10);
			if (isNaN(copies) || copies < 1) return undefined;
			return selectedCategory.unitPrice * copies;
		}

		// Regular format - calculated based on pages and format properties
		if (isRegularFormat) {
			if (
				!selectedCategory.regularFormatProperties ||
				!pdfPageCount ||
				!numberOfCopies
			) {
				return undefined;
			}

			const copies = parseInt(numberOfCopies, 10);
			if (isNaN(copies) || copies < 1) {
				return undefined;
			}

			return calculateRegularFormatPrice(
				pdfPageCount,
				selectedCategory.regularFormatProperties,
				selectedCategory.unitPrice,
				copies
			);
		}

		// Regular print job - unitPrice * quantity
		const quantity = parseInt(orderDetails.quantity, 10);
		if (isNaN(quantity) || quantity < 1) return undefined;
		return selectedCategory.unitPrice * quantity;
	};

	const totalPrice = calculateTotalPrice();

	console.log("selectedCategory ------ ", selectedCategory);

	const handleDrag = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>): void => {
		e.preventDefault();
		e.stopPropagation();
		setDragActive(false);

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			validateAndSetFile(e.dataTransfer.files[0]);
		}
	};

	// File validation helper
	const validateAndSetFile = (file: File) => {
		// For regular_format, only allow PDF files
		const isRegularFormatCategory =
			selectedCategory?.categoryType === "regular_format";

		const allowedExtensions = isRegularFormatCategory
			? [".pdf"]
			: [
					".pdf",
					".png",
					".jpg",
					".jpeg",
					".doc",
					".docx",
					".xls",
					".xlsx",
					".ppt",
					".pptx",
			  ];

		const fileName = file.name.toLowerCase();
		const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

		if (isAllowed) {
			setSelectedFile(file);
			setUploadStatus(null);
		} else {
			const errorMessage = isRegularFormatCategory
				? "Please upload a PDF file only"
				: "Please upload a valid file (PDF, Image, or Document)";
			setUploadStatus({
				type: "error",
				message: errorMessage,
			});
		}
	};

	const isFormValid = () => {
		// Category is required for all print jobs
		if (!selectedCategory) {
			return false;
		}

		if (isResultsChecker) {
			// Validation for results checker forms
			if (isNovDecResult) {
				return (
					resultsCheckerForm.indexNumber &&
					resultsCheckerForm.yearOfCompletion &&
					resultsCheckerForm.dateOfBirth
				);
			} else if (isBeceOrWassceResult) {
				return (
					resultsCheckerForm.indexNumber && resultsCheckerForm.yearOfCompletion
				);
			}
			return false;
		} else if (isFormatCategory) {
			// Validation for format categories
			if (isLargeFormat) {
				return (
					selectedFile &&
					orderDetails.width &&
					orderDetails.height &&
					numberOfCopies
				);
			} else if (isRegularFormat) {
				return selectedFile && numberOfCopies;
			}
			return false;
		} else {
			// Validation for regular print job form
			return (
				selectedFile &&
				orderDetails.artwork &&
				orderDetails.width &&
				orderDetails.height &&
				orderDetails.quantity &&
				orderDetails.location
			);
		}
	};

	// Handler for payment success - proceed with submission
	const handlePaymentSuccess = async (reference: string) => {
		if (!pendingSubmission || !selectedCategory || !id || !user?._id) {
			return;
		}

		setUploading(true);
		setUploadStatus(null);

		try {
			let response;

			if (pendingSubmission.type === "results") {
				const data = pendingSubmission.data as {
					indexNumber: string;
					yearOfCompletion: string;
					dateOfBirth?: string;
				};
				response = await submitResultsChecker({
					categoryId: selectedCategory._id || selectedCategory.id,
					adminId: id,
					indexNumber: data.indexNumber.trim(),
					yearOfCompletion: data.yearOfCompletion.trim(),
					dateOfBirth: data.dateOfBirth?.trim(),
					categoryType: selectedCategory.categoryType || "",
					clientId: user._id,
				});
			} else if (pendingSubmission.type === "format") {
				const formData = pendingSubmission.data as FormData;
				formData.append("paymentReference", reference);
				response = await submitFormatPrintJob(formData, user._id);
			} else if (pendingSubmission.type === "regular") {
				const formData = pendingSubmission.data as FormData;
				formData.append("paymentReference", reference);
				response = await submitRegularPrintJob(formData, user._id);
			} else {
				throw new Error("Invalid submission type");
			}

			toast.success(response.message || "Order submitted successfully!");
			setUploadStatus({
				type: "success",
				message: response.message || "Order submitted successfully!",
			});

			// Reset form after delay
			setTimeout(() => {
				setSelectedFile(null);
				setResultsCheckerForm({
					indexNumber: "",
					yearOfCompletion: "",
					dateOfBirth: "",
				});
				setOrderDetails({
					artwork: "",
					width: "",
					height: "",
					quantity: "1",
					location: "",
					description: "",
				});
				setNumberOfCopies("1");
				setPdfPageCount(undefined);
				setUploadStatus(null);
				setPendingSubmission(null);
			}, 3000);
		} catch (error: unknown) {
			console.error("Submission Error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to submit order. Please try again.";
			setUploadStatus({ type: "error", message: errorMessage });
			toast.error(errorMessage);
		} finally {
			setUploading(false);
		}
	};

	// Handler for payment error
	const handlePaymentError = (error: string) => {
		setUploadStatus({ type: "error", message: error });
		toast.error(error);
		setPendingSubmission(null);
	};

	// Handler for results checker form submission
	const handleResultsCheckerSubmit = async (data: {
		indexNumber: string;
		yearOfCompletion: string;
		dateOfBirth?: string;
	}) => {
		if (!selectedCategory || !id || !user?._id || !printStation) return;

		// Check if payment is required
		if (!printStation.paystackSubaccountCode) {
			toast.error(
				"Payment information is not available for this print station"
			);
			return;
		}

		if (totalPrice === undefined) {
			toast.error("Unable to calculate price. Please try again.");
			return;
		}

		// Store submission data and show payment modal
		setPendingSubmission({
			type: "results",
			data,
		});
		setShowPaymentModal(true);
	};

	// Handler for format category submission
	const handleFormatSubmit = async () => {
		if (
			!isFormValid() ||
			!id ||
			!user?._id ||
			!selectedFile ||
			!selectedCategory ||
			!printStation
		)
			return;

		// Check if payment is required
		if (!printStation.paystackSubaccountCode) {
			toast.error(
				"Payment information is not available for this print station"
			);
			return;
		}

		if (totalPrice === undefined) {
			toast.error("Unable to calculate price. Please try again.");
			return;
		}

		// Prepare form data
		const formData = new FormData();
		formData.append("pdfFile", selectedFile);
		formData.append("categoryId", selectedCategory._id || selectedCategory.id);
		formData.append("adminId", id);
		formData.append("categoryType", selectedCategory.categoryType || "");
		formData.append("quantity", numberOfCopies);

		if (isLargeFormat) {
			formData.append("width", orderDetails.width.trim());
			formData.append("height", orderDetails.height.trim());
			formData.append(
				"size",
				`${orderDetails.width.trim()} x ${orderDetails.height.trim()}`
			);
		}

		// Store submission data and show payment modal
		setPendingSubmission({
			type: "format",
			data: formData,
		});
		setShowPaymentModal(true);
	};

	// Handler for regular print job submission
	const handleRegularPrintSubmit = async () => {
		if (
			!isFormValid() ||
			!id ||
			!user?._id ||
			!selectedFile ||
			!selectedCategory ||
			!printStation
		)
			return;

		// Check if payment is required
		if (!printStation.paystackSubaccountCode) {
			toast.error(
				"Payment information is not available for this print station"
			);
			return;
		}

		if (totalPrice === undefined) {
			toast.error("Unable to calculate price. Please try again.");
			return;
		}

		// Prepare form data
		const formData = new FormData();
		formData.append("pdfFile", selectedFile);
		formData.append("categoryId", selectedCategory._id || selectedCategory.id);
		formData.append("adminId", id);
		formData.append("artwork", orderDetails.artwork.trim());
		formData.append("width", orderDetails.width.trim());
		formData.append("height", orderDetails.height.trim());
		formData.append(
			"size",
			`${orderDetails.width.trim()} x ${orderDetails.height.trim()}`
		);
		formData.append("quantity", orderDetails.quantity);
		formData.append("location", orderDetails.location.trim());

		if (orderDetails.description && orderDetails.description.trim()) {
			formData.append("description", orderDetails.description.trim());
		}

		formData.append("submittedBy", "frontend-user");
		formData.append("copies", "1");
		formData.append("color", "true");
		formData.append("duplex", "false");

		if (id) {
			formData.append("printStationId", id);
		}

		// Store submission data and show payment modal
		setPendingSubmission({
			type: "regular",
			data: formData,
		});
		setShowPaymentModal(true);
	};

	// Unified handler that routes to the appropriate submission method
	const handleUpload = async () => {
		if (isResultsChecker) {
			// Results checker uses its own handler
			await handleResultsCheckerSubmit({
				indexNumber: resultsCheckerForm.indexNumber,
				yearOfCompletion: resultsCheckerForm.yearOfCompletion,
				dateOfBirth: resultsCheckerForm.dateOfBirth,
			});
		} else if (isFormatCategory) {
			await handleFormatSubmit();
		} else {
			await handleRegularPrintSubmit();
		}
	};

	const removeFile = () => {
		setSelectedFile(null);
		setUploadStatus(null);
		setPdfPageCount(undefined);
	};

	console.log("printStation", printStation);

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	const handleGetDirections = () => {
		if (!printStation) return;

		const url = getDirectionsUrl(printStation, userLocation);
		if (!url) {
			alert("Location information not available for this print station");
			return;
		}

		window.open(url, "_blank");
	};

	if (loading) {
		return (
			<div className="w-full max-w-3xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<div className="w-8 h-8 border-4 border-slate-700 border-t-transparent rounded-full animate-spin"></div>
				</div>
			</div>
		);
	}

	if (!printStation) {
		return (
			<div className="w-full max-w-3xl bg-white p-8">
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						Print Station Not Found
					</h2>
					<p className="text-gray-600 mb-4">
						The print station you're looking for doesn't exist.
					</p>
					<button
						onClick={() => navigate("/")}
						className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-3xl bg-white p-4 lg:p-8">
			{/* Back Button */}
			<button
				onClick={() => navigate("/")}
				className="mb-4 sm:mb-6 flex items-center text-sm text-gray-600 hover:text-slate-700 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to Print Stations
			</button>

			{/* Print Station Info */}
			<div className="mb-6 sm:mb-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
				<div className="flex items-start justify-between mb-2">
					<div className="flex-1">
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
							{printStation.name}
						</h2>
						<p className="text-sm text-gray-600 mb-1">
							<span className="font-medium">Email:</span> {printStation.email}
						</p>
					</div>
					{printStation.location?.latitude &&
						printStation.location?.longitude && (
							<button
								onClick={handleGetDirections}
								className="ml-4 flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-gray-300 whitespace-nowrap"
								title="Get directions on Google Maps"
							>
								<MapPin className="w-4 h-4" />
								<span className="sm:inline">Directions</span>
								<ExternalLink className="w-3 h-3" />
							</button>
						)}
				</div>
				{selectedCategory && (
					<div className="mt-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
						<p className="text-sm font-medium text-indigo-900 mb-1">
							Selected Category: {selectedCategory.name}
						</p>
						<p className="text-xs text-indigo-700">
							Price: GHS{selectedCategory.unitPrice.toFixed(2)} per unit
						</p>
					</div>
				)}
				{printStation.location?.address && (
					<p className="text-sm text-gray-600">
						<span className="font-medium">Location:</span>{" "}
						{printStation.location.address}
					</p>
				)}
			</div>

			<div className="text-center mb-6 sm:mb-8">
				<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full mb-3 sm:mb-4">
					<Printer className="w-6 h-6 sm:w-8 sm:h-8 text-slate-700" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					{isResultsChecker
						? "Results Checker Request"
						: isFormatCategory
						? "Format Print Order"
						: "Print Job Order Form"}
				</h1>
				<p className="text-sm sm:text-base text-gray-600">
					{isResultsChecker
						? "Fill in the required information to check your results"
						: isFormatCategory
						? "Upload your file and provide the required details"
						: "Upload your file and fill in the job details"}
				</p>
			</div>

			{isResultsChecker && selectedCategory ? (
				<ResultsCheckerForm
					category={selectedCategory}
					indexNumber={resultsCheckerForm.indexNumber}
					yearOfCompletion={resultsCheckerForm.yearOfCompletion}
					dateOfBirth={resultsCheckerForm.dateOfBirth || ""}
					onIndexNumberChange={(value) =>
						setResultsCheckerForm((prev) => ({ ...prev, indexNumber: value }))
					}
					onYearOfCompletionChange={(value) =>
						setResultsCheckerForm((prev) => ({
							...prev,
							yearOfCompletion: value,
						}))
					}
					onDateOfBirthChange={(value) =>
						setResultsCheckerForm((prev) => ({ ...prev, dateOfBirth: value }))
					}
					loading={uploading}
				/>
			) : isFormatCategory && selectedCategory ? (
				<FormatPrintForm
					category={selectedCategory}
					onFileSelect={validateAndSetFile}
					onFileRemove={removeFile}
					selectedFile={selectedFile}
					onWidthChange={(value) =>
						setOrderDetails((prev) => ({ ...prev, width: value }))
					}
					onHeightChange={(value) =>
						setOrderDetails((prev) => ({ ...prev, height: value }))
					}
					onCopiesChange={setNumberOfCopies}
					width={orderDetails.width}
					height={orderDetails.height}
					numberOfCopies={numberOfCopies}
					dragActive={dragActive}
					onDrag={handleDrag}
					onDrop={handleDrop}
					formatFileSize={formatFileSize}
					loading={uploading}
					pdfPageCount={pdfPageCount}
					totalPrice={totalPrice}
				/>
			) : (
				<RegularPrintForm
					onFileSelect={validateAndSetFile}
					onFileRemove={removeFile}
					selectedFile={selectedFile}
					onInputChange={(name, value) =>
						setOrderDetails((prev) => ({ ...prev, [name]: value }))
					}
					orderDetails={orderDetails}
					dragActive={dragActive}
					onDrag={handleDrag}
					onDrop={handleDrop}
					formatFileSize={formatFileSize}
					loading={uploading}
				/>
			)}

			{/* Status Messages */}
			{uploadStatus && (
				<div
					className={`mt-4 sm:mt-6 p-3 sm:p-4 rounded-lg flex items-start sm:items-center ${
						uploadStatus.type === "success"
							? "bg-green-50 text-green-800"
							: "bg-red-50 text-red-800"
					}`}
				>
					{uploadStatus.type === "success" ? (
						<CheckCircle className="w-5 h-5 mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
					) : (
						<AlertCircle className="w-5 h-5 mr-2 sm:mr-3 shrink-0 mt-0.5 sm:mt-0" />
					)}
					<p className="text-sm font-medium break-word">
						{uploadStatus.message}
					</p>
				</div>
			)}

			{/* Submit Button */}
			<button
				onClick={handleUpload}
				disabled={uploading || !isFormValid()}
				className={`w-full mt-4 sm:mt-6 py-3.5 sm:py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center text-sm sm:text-base touch-manipulation ${
					uploading || !isFormValid()
						? "bg-gray-400 cursor-not-allowed"
						: "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800"
				}`}
			>
				{uploading ? (
					<>
						<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 sm:mr-3"></div>
						{isResultsChecker
							? "Submitting Request..."
							: isFormatCategory
							? "Submitting Print Order..."
							: "Sending to Print Queue..."}
					</>
				) : (
					<>
						<Printer className="w-5 h-5 mr-2 sm:mr-3" />
						{isResultsChecker
							? "Check Results"
							: isFormatCategory
							? "Submit Print Order"
							: "Send to Print Queue"}
					</>
				)}
			</button>

			{/* Payment Modal */}
			{showPaymentModal &&
				printStation &&
				printStation.paystackSubaccountCode &&
				totalPrice !== undefined &&
				user && (
					<PaymentModal
						isOpen={showPaymentModal}
						onClose={() => {
							setShowPaymentModal(false);
							setPendingSubmission(null);
						}}
						amount={totalPrice}
						email={user.email}
						subaccount={printStation?.paystackSubaccountCode as string}
						onPaymentSuccess={handlePaymentSuccess}
						onPaymentError={handlePaymentError}
					/>
				)}
		</div>
	);
};


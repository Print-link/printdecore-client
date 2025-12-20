import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Printer, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { useFileHandling } from "../hooks/useFileHandling";
import { useFormValidation } from "../hooks/useFormValidation";
import { usePriceCalculation } from "../hooks/usePriceCalculation";
import { usePrintJobSubmission } from "../hooks/usePrintJobSubmission";
import { getDirectionsUrl } from "../utils/stationUtils";
import { formatFileSize } from "../utils/fileUtils";
import { toast } from "react-toastify";
import { bussinessCategoryService } from "../services/bussinessCategoryService";
import { countPdfPages } from "../utils/pdfUtils";
import { getBranchById } from "../services/branches.service";
import type { Category } from "../types/category";
import { ResultsCheckerForm } from "../components/forms/ResultsCheckerForm";
import { FormatPrintForm } from "../components/forms/FormatPrintForm";
import { RegularPrintForm } from "../components/forms/RegularPrintForm";
import { PaymentModal } from "../components/PaymentModal";
import { PrintStationHeader } from "../components/PrintStationHeader";
import { StatusMessage } from "../components/StatusMessage";
import type { PrintStation } from "../types/printStation";
import { useQuery } from "@tanstack/react-query";

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

interface ResultsCheckerFormData {
	indexNumber: string;
	yearOfCompletion: string;
	dateOfBirth?: string;
}

export const PrintStationDetails = () => {
	const { id } = useParams<{ id: string }>();
	// const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();

	const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
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
		useState<ResultsCheckerFormData>({
			indexNumber: "",
			yearOfCompletion: "",
			dateOfBirth: "",
		});
	const [numberOfCopies, setNumberOfCopies] = useState<string>("1");
	const [pdfPageCount, setPdfPageCount] = useState<number | undefined>(
		undefined
	);
	const [showPaymentModal, setShowPaymentModal] = useState(false);

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

	const {
		selectedFile,
		dragActive,
		validateAndSetFile,
		handleDrag,
		handleDrop,
		removeFile: removeFileHandler,
	} = useFileHandling({
		selectedCategory,
		onFileError: (message) => {
			setUploadStatus({ type: "error", message });
		},
	});

	const { totalPrice } = usePriceCalculation({
		selectedCategory,
		isResultsChecker,
		isLargeFormat,
		isRegularFormat,
		numberOfCopies,
		pdfPageCount,
		quantity: orderDetails.quantity,
	});

	const { isFormValid } = useFormValidation({
		selectedCategory,
		isResultsChecker,
		isNovDecResult,
		isBeceOrWassceResult,
		isLargeFormat,
		isRegularFormat,
		isFormatCategory,
		selectedFile,
		resultsCheckerForm,
		orderDetails,
		numberOfCopies,
	});

	const {
		uploading,
		setPendingSubmission,
		handlePaymentSuccess: handleSubmissionSuccess,
		handlePaymentError,
	} = usePrintJobSubmission({
		selectedCategory,
		adminId: id || "",
		userId: user?._id || "",
	});

	const {
		data: branch,
		isLoading: isBranchLoading,
		error: branchError,
	} = useQuery({
		queryKey: ["branch", id],
		queryFn: () => getBranchById(id || ""),
		enabled: !!id,
	});

	const {
		data: categories,
		isLoading: isCategoriesLoading,
		error: categoriesError,
	} = useQuery({
		queryKey: ["categories"],
		queryFn: () => bussinessCategoryService.getAllBussinessCategories(),
	});

	useEffect(() => {
		if (isResultsChecker && uploadStatus?.type === "error") {
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

	useEffect(() => {
		const countPages = async () => {
			if (
				selectedFile &&
				isRegularFormat &&
				selectedCategory &&
				(selectedFile.type === "application/pdf" ||
					selectedFile.name?.toLowerCase().endsWith(".pdf"))
			) {
				try {
					const pages = await countPdfPages(selectedFile);
					setPdfPageCount(pages);
					setUploadStatus(null);
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
				if (!selectedFile || !isRegularFormat) {
					setPdfPageCount(undefined);
				}
			}
		};

		countPages();
	}, [selectedFile, isRegularFormat, selectedCategory]);

	const handlePaymentSuccess = useCallback(
		async (paymentData: { reference: string; amount: number }) => {
			const result = await handleSubmissionSuccess(paymentData);
			if (result?.success) {
				setUploadStatus({
					type: "success",
					message: result.message || "Order submitted successfully!",
				});
				setTimeout(() => {
					removeFileHandler();
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
			}
		},
		[handleSubmissionSuccess, setPendingSubmission, removeFileHandler]
	);

	const handleResultsCheckerSubmit = useCallback(
		async (data: ResultsCheckerFormData) => {
			if (!selectedCategory || !id || !user?._id || !printStation) return;

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

			setPendingSubmission({
				type: "results",
				data,
			});
			setShowPaymentModal(true);
		},
		[
			selectedCategory,
			id,
			user?._id,
			printStation,
			totalPrice,
			setPendingSubmission,
		]
	);

	const handleFormatSubmit = useCallback(async () => {
		if (
			!isFormValid ||
			!id ||
			!user?._id ||
			!selectedFile ||
			!selectedCategory ||
			!printStation
		)
			return;

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

		setPendingSubmission({
			type: "format",
			data: formData,
		});
		setShowPaymentModal(true);
	}, [
		isFormValid,
		id,
		user?._id,
		selectedFile,
		selectedCategory,
		printStation,
		totalPrice,
		numberOfCopies,
		orderDetails,
		isLargeFormat,
		setPendingSubmission,
	]);

	const handleRegularPrintSubmit = useCallback(async () => {
		if (
			!isFormValid ||
			!id ||
			!user?._id ||
			!selectedFile ||
			!selectedCategory ||
			!printStation
		)
			return;

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

		setPendingSubmission({
			type: "regular",
			data: formData,
		});
		setShowPaymentModal(true);
	}, [
		isFormValid,
		id,
		user?._id,
		selectedFile,
		selectedCategory,
		printStation,
		totalPrice,
		orderDetails,
		setPendingSubmission,
	]);

	const handleUpload = useCallback(async () => {
		if (isResultsChecker) {
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
	}, [
		isResultsChecker,
		isFormatCategory,
		resultsCheckerForm,
		handleResultsCheckerSubmit,
		handleFormatSubmit,
		handleRegularPrintSubmit,
	]);

	const removeFile = useCallback(() => {
		removeFileHandler();
		setUploadStatus(null);
		setPdfPageCount(undefined);
	}, [removeFileHandler]);

	const handleGetDirections = useCallback(() => {
		if (!printStation) return;
		const url = getDirectionsUrl(printStation, userLocation);
		if (!url) {
			alert("Location information not available for this print station");
			return;
		}
		window.open(url, "_blank");
	}, [printStation, userLocation]);

	const handlePaymentErrorWithStatus = useCallback(
		(error: string) => {
			handlePaymentError(error);
			setUploadStatus({ type: "error", message: error });
		},
		[handlePaymentError]
	);

	if (loading) {
		return (
			<div className="w-full max-w-3xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<div className="w-8 h-8 border-4 border-[#63A361] border-t-transparent rounded-full animate-spin"></div>
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
						className="inline-flex items-center px-4 py-2 bg-[#63A361] text-white rounded-lg hover:bg-[#63A361] transition-colors"
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
			<button
				onClick={() => navigate("/")}
				className="mb-4 sm:mb-6 flex items-center text-sm text-gray-600 hover:text-[#63A361] transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to Print Stations
			</button>

			<PrintStationHeader
				printStation={printStation}
				selectedCategory={selectedCategory}
				onGetDirections={handleGetDirections}
			/>

			<div className="text-center mb-6 sm:mb-8">
				<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 rounded-full mb-3 sm:mb-4">
					<Printer className="w-6 h-6 sm:w-8 sm:h-8 text-[#63A361]" />
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
					category={selectedCategory as Category}
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

			{uploadStatus && (
				<StatusMessage
					type={uploadStatus.type}
					message={uploadStatus.message}
				/>
			)}

			<button
				onClick={handleUpload}
				disabled={uploading || !isFormValid}
				className={`w-full mt-4 sm:mt-6 py-3.5 sm:py-4 rounded-xl font-semibold text-white transition-all flex items-center justify-center text-sm sm:text-base touch-manipulation ${
					uploading || !isFormValid
						? "bg-gray-400 cursor-not-allowed"
						: "bg-[#63A361] hover:bg-[#63A361] active:bg-[#63A361]"
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
						subaccount={printStation.paystackSubaccountCode}
						onPaymentSuccess={handlePaymentSuccess}
						onPaymentError={handlePaymentErrorWithStatus}
					/>
				)}
		</div>
	);
};

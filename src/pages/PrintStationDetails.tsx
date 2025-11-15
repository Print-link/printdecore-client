import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Upload, FileText, Printer, X, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from "react-toastify";

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

interface PrintStation {
	_id: string;
	id?: string;
	name: string;
	email: string;
	location?: {
		latitude: number;
		longitude: number;
		address: string;
	};
}

export const PrintStationDetails = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [uploading, setUploading] = useState<boolean>(false);
	const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
	const [dragActive, setDragActive] = useState<boolean>(false);
	const [printStation, setPrintStation] = useState<PrintStation | null>(null);
	const [loading, setLoading] = useState<boolean>(true);
	const [orderDetails, setOrderDetails] = useState<OrderDetails>({
		artwork: "",
		width: "",
		height: "",
		quantity: "1",
		location: "",
		description: "",
	});

	const { user } = useAuth();

	useEffect(() => {
		const fetchPrintStation = async () => {
			try {
				const response = await apiService.getAllPrintStations();
				if (response.success && response.data?.printStations) {
					const station = response.data.printStations.find(
						(station) => station._id === id || station.id === id
					);
					if (station) {
						setPrintStation(station);
					} else {
						setUploadStatus({
							type: "error",
							message: "Print station not found",
						});
					}
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

		if (id) {
			fetchPrintStation();
		}
	}, [id]);

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
			const file = e.dataTransfer.files[0];
			const allowedExtensions = [
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
				setUploadStatus({
					type: "error",
					message: "Please upload a valid file (PDF, Image, or Document)",
				});
			}
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>): void => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			const allowedExtensions = [
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
				setUploadStatus({
					type: "error",
					message: "Please upload a valid file (PDF, Image, or Document)",
				});
			}
		}
	};

	const handleInputChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => {
		const { name, value } = e.target;
		setOrderDetails((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const isFormValid = () => {
		return (
			selectedFile &&
			orderDetails.artwork &&
			orderDetails.width &&
			orderDetails.height &&
			orderDetails.quantity &&
			orderDetails.location
		);
	};

	const handleUpload = async () => {
		if (!selectedFile || !isFormValid() || !id) return;

		setUploading(true);
		setUploadStatus(null);

		try {
			const formData = new FormData();

			// Append file with the correct field name expected by multer
			formData.append("pdfFile", selectedFile);

			// Append all required job order fields
			formData.append("artwork", orderDetails.artwork.trim());
			formData.append("width", orderDetails.width.trim());
			formData.append("height", orderDetails.height.trim());
			formData.append("adminId", id);
			formData.append(
				"size",
				`${orderDetails.width.trim()} x ${orderDetails.height.trim()}`
			);
			formData.append("quantity", orderDetails.quantity);
			formData.append("location", orderDetails.location.trim());

			// Append optional description
			if (orderDetails.description && orderDetails.description.trim()) {
				formData.append("description", orderDetails.description.trim());
			}

			// Append other fields
			formData.append("submittedBy", "frontend-user");
			formData.append("copies", "1");
			formData.append("color", "true");
			formData.append("duplex", "false");

			// Append print station ID
			if (id) {
				formData.append("printStationId", id);
			}

			// Make the actual API call using authenticated service
			// Use the user ID for the client endpoint
			const data = await apiService.uploadFile(
				formData,
				`/print/submit/client/${user?._id}`
			);

			toast.success(data.message || "Print job sent to queue successfully!");
			setUploadStatus({
				type: "success",
				message: data.message || "Print job sent to queue successfully!",
			});

			console.log("✅ Server Response:", data);

			// Reset after delay
			setTimeout(() => {
				setSelectedFile(null);
				setOrderDetails({
					artwork: "",
					width: "",
					height: "",
					quantity: "1",
					location: "",
					description: "",
				});
				setUploadStatus(null);
			}, 3000);
		} catch (error: unknown) {
			console.error("Upload Error:", error);
			const errorMessage =
				error instanceof Error
					? error.message
					: "Failed to send file to print queue. Please try again.";
			setUploadStatus({ type: "error", message: errorMessage });
		} finally {
			setUploading(false);
		}
	};

	const removeFile = () => {
		setSelectedFile(null);
		setUploadStatus(null);
	};

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	if (loading) {
		return (
			<div className="w-full max-w-3xl mx-auto bg-white rounded-2xl p-8">
				<div className="flex items-center justify-center py-12">
					<div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
				</div>
			</div>
		);
	}

	if (!printStation) {
		return (
			<div className="w-full max-w-3xl mx-auto bg-white rounded-2xl shadow-xl p-8">
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
						className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Home
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="w-full max-w-3xl mx-auto bg-white rounded-2xl border border-gray-300 p-4 sm:p-6 lg:p-8">
			{/* Back Button */}
			<button
				onClick={() => navigate("/")}
				className="mb-4 sm:mb-6 flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to Print Stations
			</button>

			{/* Print Station Info */}
			<div className="mb-6 sm:mb-8 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
				<h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
					{printStation.name}
				</h2>
				<p className="text-sm text-gray-600 mb-1">
					<span className="font-medium">Email:</span> {printStation.email}
				</p>
				{printStation.location?.address && (
					<p className="text-sm text-gray-600">
						<span className="font-medium">Location:</span>{" "}
						{printStation.location.address}
					</p>
				)}
			</div>

			<div className="text-center mb-6 sm:mb-8">
				<div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full mb-3 sm:mb-4">
					<Printer className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
				</div>
				<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
					Print Job Order Form
				</h1>
				<p className="text-sm sm:text-base text-gray-600">
					Upload your file and fill in the job details
				</p>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
				{/* Left Column - Upload Area */}
				<div>
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
						Upload File
					</h3>
					<div
						className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 transition-all ${
							dragActive
								? "border-indigo-500 bg-indigo-50"
								: "border-gray-300 bg-gray-50"
						}`}
						onDragEnter={handleDrag}
						onDragLeave={handleDrag}
						onDragOver={handleDrag}
						onDrop={handleDrop}
					>
						{!selectedFile ? (
							<div className="text-center">
								<Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
								<p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
									Drag and drop your file here
								</p>
								<p className="text-xs text-gray-500 mb-2 sm:mb-3">or</p>
								<label className="inline-flex items-center px-4 py-2.5 sm:py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-indigo-700 transition-colors touch-manipulation">
									<Upload className="w-4 h-4 mr-2" />
									Browse Files
									<input
										type="file"
										accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
										onChange={handleFileSelect}
										className="hidden"
									/>
								</label>
								<p className="text-xs text-gray-400 mt-2 sm:mt-3 px-2">
									Supported formats: PDF, Images (PNG, JPG), Documents (DOC,
									DOCX, XLS, XLSX, PPT, PPTX)
								</p>
							</div>
						) : (
							<div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
								<div className="flex items-center flex-1 min-w-0 pr-2">
									<div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0">
										<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
											{selectedFile.name}
										</p>
										<p className="text-xs text-gray-500">
											{formatFileSize(selectedFile.size)}
										</p>
									</div>
								</div>
								<button
									onClick={removeFile}
									className="ml-2 p-2 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation shrink-0"
									disabled={uploading}
									aria-label="Remove file"
								>
									<X className="w-5 h-5 sm:w-4 sm:h-4" />
								</button>
							</div>
						)}
					</div>
				</div>

				{/* Right Column - Order Details Form */}
				<div>
					<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
						Job Order Details
					</h3>
					<div className="space-y-3 sm:space-y-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Artwork (Company/Individual) *
							</label>
							<input
								type="text"
								name="artwork"
								value={orderDetails.artwork}
								onChange={handleInputChange}
								placeholder="e.g., Shell power to grow"
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								required
							/>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5">
									Width *
								</label>
								<input
									type="text"
									name="width"
									value={orderDetails.width}
									onChange={handleInputChange}
									placeholder="e.g., 9x6m"
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
									required
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5">
									Height *
								</label>
								<input
									type="text"
									name="height"
									value={orderDetails.height}
									onChange={handleInputChange}
									placeholder="e.g., 6m"
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
									required
								/>
							</div>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Quantity *
							</label>
							<input
								type="number"
								name="quantity"
								value={orderDetails.quantity}
								onChange={handleInputChange}
								min="1"
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Location/Vendor *
							</label>
							<input
								type="text"
								name="location"
								value={orderDetails.location}
								onChange={handleInputChange}
								placeholder="e.g., T-Havannah 1, Accra Marriott"
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
								required
							/>
						</div>

						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Description (Optional)
							</label>
							<textarea
								name="description"
								value={orderDetails.description}
								onChange={handleInputChange}
								placeholder="Add any additional notes or specifications..."
								rows={3}
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
							/>
						</div>
					</div>
				</div>
			</div>

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
						Sending to Print Queue...
					</>
				) : (
					<>
						<Printer className="w-5 h-5 mr-2 sm:mr-3" />
						Send to Print Queue
					</>
				)}
			</button>
		</div>
	);
};


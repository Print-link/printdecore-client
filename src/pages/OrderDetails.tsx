import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
	ArrowLeft,
	FileText,
	Tag,
	Calendar,
	Clock,
	Package,
	MapPin,
	Info,
	User,
	Mail,
	Phone,
	CheckCircle,
	XCircle,
	AlertCircle,
	Printer,
	MessageSquare,
} from "lucide-react";
import { getClientOrderById } from "../services/orderApi";
import { createSupportTicket } from "../services/supportApi";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";
import { ReportIssueModal } from "../components/ReportIssueModal";
import type { Category, CategoryType } from "../types/category";

interface ExecutedBy {
	_id?: string;
	name?: string;
	email?: string;
	phone?: string;
}

interface Order {
	_id?: string;
	id?: string;
	createdAt?: string;
	status?: string;
	fileName?: string;
	fileSize?: number;
	originalName?: string;
	artwork?: string;
	width?: string;
	height?: string;
	size?: string;
	quantity?: number;
	location?: string;
	description?: string;
	clientId?: string | { _id?: string };
	adminId?: string | { _id?: string };
	categoryId?: Category | {
		_id?: string;
		name?: string;
		unitPrice?: number;
		categoryType?: CategoryType;
	};
	executedBy?: ExecutedBy | string;
	executedByModel?: string;
	indexNumber?: string;
	yearOfCompletion?: string;
	dateOfBirth?: string;
	categoryType?: CategoryType;
	submittedBy?: string;
}

export const OrderDetails = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [order, setOrder] = useState<Order | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [submittingReport, setSubmittingReport] = useState(false);

	useEffect(() => {
		const fetchOrder = async () => {
			if (!id) {
				setError("Order ID is required");
				setLoading(false);
				return;
			}

			try {
				const response = await getClientOrderById(id);
				if (response.success && response.data?.order) {
					setOrder(response.data.order as Order);
				} else {
					setError(response.message || "Order not found");
				}
			} catch (err) {
				console.error("Error fetching order:", err);
				setError(
					err instanceof Error ? err.message : "Failed to load order details"
				);
			} finally {
				setLoading(false);
			}
		};

		fetchOrder();
	}, [id]);

	const formatFileSize = (bytes: number) => {
		if (!bytes || bytes === 0) return "N/A";
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		return (bytes / (1024 * 1024)).toFixed(1) + " MB";
	};

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusBadge = (status?: string) => {
		const statusStyles = {
			pending: "bg-yellow-100 text-yellow-800",
			processing: "bg-blue-100 text-blue-800",
			completed: "bg-green-100 text-green-800",
			failed: "bg-red-100 text-red-800",
		};

		const statusIcon = {
			pending: <Clock className="w-4 h-4" />,
			processing: <Printer className="w-4 h-4" />,
			completed: <CheckCircle className="w-4 h-4" />,
			failed: <XCircle className="w-4 h-4" />,
		};

		const orderStatus = (status || "pending").toLowerCase();

		return (
			<span
				className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
					statusStyles[orderStatus as keyof typeof statusStyles] ||
					statusStyles.pending
				}`}
			>
				{statusIcon[orderStatus as keyof typeof statusIcon] || statusIcon.pending}
				{orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
			</span>
		);
	};

	if (loading) {
		return (
			<div className="w-full max-w-4xl mx-auto bg-white p-4 lg:p-8">
				<div className="text-center py-12">
					<div className="w-12 h-12 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
					<p className="text-gray-500">Loading order details...</p>
				</div>
			</div>
		);
	}

	if (error || !order) {
		return (
			<div className="w-full max-w-4xl mx-auto bg-white p-4 lg:p-8">
				<button
					onClick={() => navigate("/history")}
					className="mb-4 flex items-center text-sm text-gray-600 hover:text-slate-700 transition-colors"
				>
					<ArrowLeft className="w-4 h-4 mr-2" />
					Back to History
				</button>
				<div className="text-center py-12">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<h2 className="text-xl font-semibold text-gray-900 mb-2">
						{error || "Order Not Found"}
					</h2>
					<p className="text-gray-600 mb-4">
						{error || "The order you're looking for doesn't exist."}
					</p>
					<button
						onClick={() => navigate("/history")}
						className="inline-flex items-center px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors"
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to History
					</button>
				</div>
			</div>
		);
	}

	const category =
		typeof order.categoryId === "object" && order.categoryId !== null
			? order.categoryId
			: null;
	const categoryName = category?.name || "Unknown Category";
	const categoryPrice = category?.unitPrice || 0;
	const categoryType = category?.categoryType || order.categoryType;

	const isResultsChecker =
		categoryType === "wassce_result" ||
		categoryType === "bece_result" ||
		categoryType === "novdec_result";
	const hasFile = !!(order.fileName || order.originalName || order.fileSize);

	const executedBy =
		typeof order.executedBy === "object" && order.executedBy !== null
			? order.executedBy
			: null;

	// Extract IDs for support ticket
	const jobId = order._id || order.id || "";
	const clientId = user?._id || (typeof order.clientId === "object" ? order.clientId._id : order.clientId) || "";
	const adminId = typeof order.adminId === "object" ? order.adminId._id : order.adminId || "";

	const handleReportIssue = async (message: string) => {
		if (!jobId || !clientId || !adminId) {
			throw new Error("Missing required information to submit support ticket");
		}

		setSubmittingReport(true);
		try {
			const response = await createSupportTicket({
				message,
				jobId,
				clientId,
			});

			if (response.success) {
				toast.success("Support ticket created successfully!");
			} else {
				throw new Error(response.message || "Failed to create support ticket");
			}
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to submit support ticket";
			toast.error(errorMessage);
			throw err;
		} finally {
			setSubmittingReport(false);
		}
	};

	return (
		<div className="w-full max-w-4xl mx-auto bg-white p-4 lg:p-8">
			{/* Back Button */}
			<button
				onClick={() => navigate("/history")}
				className="mb-4 sm:mb-6 flex items-center text-sm text-gray-600 hover:text-slate-700 transition-colors"
			>
				<ArrowLeft className="w-4 h-4 mr-2" />
				Back to History
			</button>

			{/* Header */}
			<div className="mb-6 sm:mb-8">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
					<div>
						<h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
							Order Details
						</h1>
						{getStatusBadge(order.status)}
					</div>
					<button
						onClick={() => setIsReportModalOpen(true)}
						className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
					>
						<MessageSquare className="w-4 h-4" />
						Report Issue
					</button>
				</div>

				{/* Category Info */}
				<div className="bg-indigo-50 rounded-xl p-4 sm:p-6 border border-indigo-200">
					<div className="flex items-center gap-2 mb-2">
						<Tag className="w-5 h-5 text-indigo-600" />
						<h2 className="text-lg sm:text-xl font-semibold text-indigo-900">
							{categoryName}
						</h2>
					</div>
					<p className="text-sm sm:text-base text-indigo-700">
						Unit Price: <span className="font-semibold">GHS {categoryPrice.toFixed(2)}</span>
					</p>
				</div>
			</div>

			{/* Order Information */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
				{/* Left Column - Main Details */}
				<div className="space-y-4 sm:space-y-6">
					{/* Results Checker Information */}
					{isResultsChecker && (
						<div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
								Results Checker Information
							</h3>
							<div className="space-y-3">
								{order.indexNumber && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Index Number</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.indexNumber}
										</p>
									</div>
								)}
								{order.yearOfCompletion && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Year of Completion</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.yearOfCompletion}
										</p>
									</div>
								)}
								{order.dateOfBirth && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Date of Birth</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.dateOfBirth}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* File Information */}
					{hasFile && !isResultsChecker && (
						<div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<FileText className="w-5 h-5" />
								File Information
							</h3>
							<div className="space-y-3">
								<div>
									<p className="text-xs text-gray-500 mb-1">File Name</p>
									<p className="text-sm sm:text-base font-medium text-gray-900 break-word">
										{order.fileName || order.originalName || "N/A"}
									</p>
								</div>
								{order.fileSize && (
									<div>
										<p className="text-xs text-gray-500 mb-1">File Size</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{formatFileSize(order.fileSize)}
										</p>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Print Job Details */}
					{!isResultsChecker && (order.artwork || order.width || order.height) && (
						<div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
								Print Job Details
							</h3>
							<div className="space-y-3">
								{order.artwork && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Artwork</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.artwork}
										</p>
									</div>
								)}
								{(order.width || order.height) && (
									<div className="grid grid-cols-2 gap-3">
										{order.width && (
											<div>
												<p className="text-xs text-gray-500 mb-1">Width</p>
												<p className="text-sm sm:text-base font-medium text-gray-900">
													{order.width}
												</p>
											</div>
										)}
										{order.height && (
											<div>
												<p className="text-xs text-gray-500 mb-1">Height</p>
												<p className="text-sm sm:text-base font-medium text-gray-900">
													{order.height}
												</p>
											</div>
										)}
									</div>
								)}
								{order.size && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Size</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.size}
										</p>
									</div>
								)}
								{order.quantity && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Quantity</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.quantity}
										</p>
									</div>
								)}
								{order.location && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Location</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.location}
										</p>
									</div>
								)}
								{order.description && (
									<div>
										<p className="text-xs text-gray-500 mb-1">Description</p>
										<p className="text-sm sm:text-base text-gray-700 break-word">
											{order.description}
										</p>
									</div>
								)}
							</div>
						</div>
					)}
				</div>

				{/* Right Column - Metadata & Executed By */}
				<div className="space-y-4 sm:space-y-6">
					{/* Executed By Information */}
					{executedBy && (
						<div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
							<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
								<User className="w-5 h-5" />
								Executed By
							</h3>
							<div className="space-y-3">
								{executedBy.name && (
									<div className="flex items-start gap-2">
										<User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<p className="text-xs text-gray-500 mb-1">Full Name</p>
											<p className="text-sm sm:text-base font-medium text-gray-900">
												{executedBy.name}
											</p>
										</div>
									</div>
								)}
								{executedBy.email && (
									<div className="flex items-start gap-2">
										<Mail className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<p className="text-xs text-gray-500 mb-1">Email</p>
											<p className="text-sm sm:text-base font-medium text-gray-900 break-all">
												{executedBy.email}
											</p>
										</div>
									</div>
								)}
								{executedBy.phone && (
									<div className="flex items-start gap-2">
										<Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
										<div>
											<p className="text-xs text-gray-500 mb-1">Phone Number</p>
											<p className="text-sm sm:text-base font-medium text-gray-900">
												{executedBy.phone}
											</p>
										</div>
									</div>
								)}
							</div>
						</div>
					)}

					{/* Order Metadata */}
					<div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
						<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">
							Order Information
						</h3>
						<div className="space-y-3">
							{order.createdAt && (
								<div className="flex items-start gap-2">
									<Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-xs text-gray-500 mb-1">Created At</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{formatDate(order.createdAt)}
										</p>
									</div>
								</div>
							)}
							{order.submittedBy && (
								<div className="flex items-start gap-2">
									<Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-xs text-gray-500 mb-1">Submitted By</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.submittedBy}
										</p>
									</div>
								</div>
							)}
							{order.executedByModel && (
								<div className="flex items-start gap-2">
									<User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
									<div>
										<p className="text-xs text-gray-500 mb-1">Executed By Model</p>
										<p className="text-sm sm:text-base font-medium text-gray-900">
											{order.executedByModel}
										</p>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Report Issue Modal */}
			<ReportIssueModal
				isOpen={isReportModalOpen}
				onClose={() => setIsReportModalOpen(false)}
				onSubmit={handleReportIssue}
				loading={submittingReport}
			/>
		</div>
	);
};


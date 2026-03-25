import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { toast } from "react-toastify";
import { useOrder, useOrderItems } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { getDirectionsUrl } from "../utils/stationUtils";
import { createSupportTicket } from "../services/supportApi";
import { ReportIssueModal } from "../components/ReportIssueModal";
import { OrderHeader } from "../components/order/OrderHeader";
import { OrderItemsList } from "../components/order/OrderItemsList";
import { OrderSummary } from "../components/order/OrderSummary";
import { BranchInfo } from "../components/order/BranchInfo";
import { ExecutedByInfo } from "../components/order/ExecutedByInfo";
import { CategoryInfo } from "../components/order/CategoryInfo";
import { ResultsCheckerInfo } from "../components/order/ResultsCheckerInfo";
import { FileInfoSection } from "../components/order/FileInfoSection";
import { PrintJobDetails } from "../components/order/PrintJobDetails";
import { DeliveryNotice } from "../components/order/DeliveryNotice";
import { LoadingState } from "../components/order/LoadingState";
import { ErrorState } from "../components/order/ErrorState";
import { BranchRatingSection } from "../components/ratings/BranchRatingSection";
import type { Category, CategoryType } from "../types/category";
import type { PrintStation } from "../types/printStation";

interface ExecutedBy {
	_id?: string;
	name?: string;
	email?: string;
	phone?: string;
}

interface OrderDetailsData {
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
	adminId?:
		| string
		| {
				_id?: string;
				name?: string;
				email?: string;
				location?: {
					latitude?: number;
					longitude?: number;
					address?: string;
				};
		  };
	categoryId?:
		| Category
		| {
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
	branch?: {
		id: string;
		name: string;
		phoneNumber?: string;
		branchEmailAddress?: string;
		averageRating?: number;
		totalRatings?: number;
		location?: {
			id: string;
			address: string;
			latitude: number;
			longitude: number;
		};
	};
	totalPrice?: number;
}

export const OrderDetails = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { userLocation } = useGeolocation();

	const [isReportModalOpen, setIsReportModalOpen] = useState(false);
	const [submittingReport, setSubmittingReport] = useState(false);

	// TanStack Query hooks
	const { data: orderData, isLoading, error } = useOrder(id);
	const order = orderData as OrderDetailsData | null;
	const { data: orderItems = [], isLoading: loadingItems } = useOrderItems(
		order?.id || id
	);

	console.log("order details data", orderData);
	console.log("order items", orderItems);

	// Derived data - get category/service info from order items (new flexible pricing) or order (legacy)
	const firstOrderItem = orderItems.length > 0 ? orderItems[0] : null;
	const agentService = firstOrderItem?.agentService;
	const categoryFromItem = agentService?.category;
	// const serviceTemplateFromItem = agentService?.serviceTemplate;
	// const subCategoryFromItem = agentService?.subCategory;

	// Legacy: try to get from order.categoryId
	const categoryFromOrder =
		typeof order?.categoryId === "object" && order.categoryId !== null
			? order.categoryId
			: null;

	// Use category from order item (new system) or order (legacy)
	const category = categoryFromItem || categoryFromOrder;
	// Priority: category name > service template name > subcategory name > "Unknown Category"

	// Priority: category unitPrice > agentService pricePerUnit > 0
	// const categoryPrice = category?.unitPrice || agentService?.pricePerUnit || 0;
	const categoryType =
		/*category?.categoryType ||*/ order?.categoryType || null;
	console.log("category ---", category);

	const isResultsChecker =
		categoryType === "wassce_result" ||
		categoryType === "bece_result" ||
		categoryType === "novdec_result";
	const hasFile = !!(order?.fileName || order?.originalName || order?.fileSize);

	const executedBy =
		typeof order?.executedBy === "object" && order.executedBy !== null
			? order.executedBy
			: null;

	// Extract IDs for support ticket
	const jobId = order?._id || order?.id || "";
	const clientId =
		user?._id ||
		(typeof order?.clientId === "object"
			? order.clientId._id
			: order?.clientId) ||
		"";
	const adminId =
		typeof order?.adminId === "object"
			? order.adminId._id
			: order?.adminId || "";

	const admin =
		typeof order?.adminId === "object" && order.adminId !== null
			? order.adminId
			: null;
	const hasLocation = !!(
		admin?.location?.latitude && admin?.location?.longitude
	);

	const handleGetDirections = () => {
		if (!admin || !admin.location?.latitude || !admin.location?.longitude) {
			alert("Location information not available for this print station");
			return;
		}

		const printStation: PrintStation = {
			_id: admin._id || "",
			name: admin.name || "",
			email: admin.email || "",
			location: {
				latitude: admin.location.latitude,
				longitude: admin.location.longitude,
				address: admin.location.address || "",
			},
		};

		const url = getDirectionsUrl(printStation, userLocation);
		if (!url) {
			alert("Location information not available for this print station");
			return;
		}

		window.open(url, "_blank");
	};

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

	if (isLoading) {
		return <LoadingState />;
	}

	if (error || !order) {
		return <ErrorState error={error?.message || "Order not found"} />;
	}

	return (
		<div className="w-full max-w-7xl mx-auto">
			{/* Back Button */}
			<button
				onClick={() => navigate("/home/history")}
				className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
			>
				<ArrowLeft size={16} weight="bold" className="mr-2" />
				Back to History
			</button>

			{/* Header Section */}
			<OrderHeader
				status={order.status}
				totalPrice={order.totalPrice}
				createdAt={order.createdAt}
				hasLocation={hasLocation}
				onGetDirections={handleGetDirections}
				onReportIssue={() => setIsReportModalOpen(true)}
			/>

			{/* Main Content Grid */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
				{/* Left Column - Order Items & Details (2 columns on desktop) */}
				<div className="lg:col-span-2 space-y-4">
					<OrderItemsList items={orderItems} loading={loadingItems} />

					<CategoryInfo category={category as Category} />

					{isResultsChecker && (
						<ResultsCheckerInfo
							indexNumber={order.indexNumber}
							yearOfCompletion={order.yearOfCompletion}
							dateOfBirth={order.dateOfBirth}
						/>
					)}

					{hasFile && !isResultsChecker && (
						<FileInfoSection
							fileName={order.fileName}
							originalName={order.originalName}
							fileSize={order.fileSize}
						/>
					)}

					{!isResultsChecker &&
						(order.artwork || order.width || order.height) && (
							<PrintJobDetails
								artwork={order.artwork}
								width={order.width}
								height={order.height}
								size={order.size}
								quantity={order.quantity}
								location={order.location}
								description={order.description}
							/>
						)}
				</div>

				{/* Right Column - Order Info, Branch & Executed By (1 column on desktop) */}
				<div className="space-y-4">
					<OrderSummary
						status={order.status}
						createdAt={order.createdAt}
						submittedBy={order.submittedBy}
						executedByModel={order.executedByModel}
					/>

					{order.branch && <BranchInfo branch={order.branch} />}

					{executedBy && <ExecutedByInfo executedBy={executedBy} />}
				</div>
			</div>

			{/* Delivery Notice */}
			<DeliveryNotice hasLocation={hasLocation} />

			{/* Rating Section */}
			{order.branch?.id && (
				<div className="mt-12 pt-12 border-t border-gray-200 dark:border-gray-700">
					<BranchRatingSection
						branchId={order.branch.id}
						averageRating={order.branch.averageRating}
						totalRatings={order.branch.totalRatings}
					/>
				</div>
			)}

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

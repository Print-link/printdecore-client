import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { FileText, CheckCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { PaymentModal } from "../components/PaymentModal";
import { toast } from "react-toastify";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface AdminInfo {
	_id: string;
	name: string;
	email: string;
	businessName?: string;
	businessAddress?: string;
	businessLogo?: string;
	businessPaystackSubaccountCode?: string;
}

interface QuoteData {
	quantity?: number;
	specifications: string;
	totalPrice: number;
	internalNotes?: string;
	id: string;
	adminId: AdminInfo;
	clientId: string;
	categoryId?: string;
	orderDescription?: string;
	status?: string;
	createdAt?: string;
}

export const QuoteConfirmation = () => {
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [loading, setLoading] = useState(false);
	const [fetching, setFetching] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [logoError, setLogoError] = useState(false);

	const fetchQuoteDetails = useCallback(async (jobId: string) => {
		try {
			setFetching(true);
			const response = await axios.get(
				`${BASE_URL}/print/quotes/${jobId}`
			);

			if (response.data.success && response.data.data) {
				const data = response.data.data;
				setLogoError(false); // Reset logo error for new quote
				setQuoteData({
					id: data.id,
					quantity: data.quantity,
					specifications: data.specifications,
					totalPrice: data.totalPrice,
					internalNotes: data.internalNotes,
					adminId: {
						_id: data.adminId._id,
						name: data.adminId.name,
						email: data.adminId.email,
						businessName: data.adminId.businessName,
						businessAddress: data.adminId.businessAddress,
						businessLogo: data.adminId.businessLogo,
						businessPaystackSubaccountCode: data.adminId.businessPaystackSubaccountCode,
					},
					clientId: data.clientId,
					categoryId: data.categoryId,
					orderDescription: data.orderDescription,
					status: data.status,
					createdAt: data.createdAt,
				});
			} else {
				setError("Quote not found. Please contact support.");
			}
		} catch (err: unknown) {
			console.error("Error fetching quote details:", err);
			const error = err as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				error.response?.data?.message ||
				error.message ||
				"Failed to load quote details. Please contact support.";
			setError(errorMessage);
		} finally {
			setFetching(false);
		}
	}, []);

	// Fetch quote data from endpoint
	useEffect(() => {
		const jobId = searchParams.get("jobId");

		if (!jobId) {
			setError("Missing job ID. Please check the link.");
			setFetching(false);
			return;
		}

		fetchQuoteDetails(jobId);
	}, [searchParams, fetchQuoteDetails]);

	const handlePaymentSuccess = useCallback(
		async (paymentData: { reference: string; amount: number }) => {
			if (!quoteData) return;

			setLoading(true);
			try {
				// Calculate subaccount share (93% of total payment amount)
				const subaccountShare = paymentData.amount * 0.93;
				const totalPrice = Math.round(subaccountShare * 100) / 100;

				const token = localStorage.getItem("token");
				const response = await axios.put(
					`${BASE_URL}/print/jobs/${quoteData.id}/status`,
					{
						status: "paid",
						paymentReference: paymentData.reference,
						paymentStatus: "paid",
						totalPrice: totalPrice,
						paidAt: new Date().toISOString(),
						// Include clientId for quote confirmation to ensure it's set correctly
						clientId: user?._id || quoteData.clientId,
					},
					{
						headers: {
							"Content-Type": "application/json",
							...(token && { Authorization: `Bearer ${token}` }),
						},
					}
				);

				if (response.data.success) {
					toast.success("Payment confirmed! Your order is being processed.");
					setTimeout(() => {
						navigate("/history");
					}, 2000);
				} else {
					throw new Error(response.data.message || "Failed to confirm payment");
				}
			} catch (error) {
				console.error("Error confirming payment:", error);
				const errorMessage =
					error instanceof Error
						? error.message
						: "Failed to confirm payment. Please contact support.";
				toast.error(errorMessage);
				setError(errorMessage);
			} finally {
				setLoading(false);
			}
		},
		[quoteData, navigate, user]
	);

	const handlePaymentError = useCallback((error: string) => {
		toast.error(error);
		setError(error);
	}, []);

	const handleConfirmPayment = () => {
		if (!quoteData || !user) {
			toast.error("Please log in to confirm payment");
			return;
		}

		if (!quoteData.adminId?.businessPaystackSubaccountCode) {
			toast.error("Payment information is not available. Please contact support.");
			return;
		}

		setShowPaymentModal(true);
	};

	if (fetching) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="w-8 h-8 border-4 border-[#63A361] border-t-transparent rounded-full animate-spin"></div>
			</div>
		);
	}

	if (error && !quoteData) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
				<div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8">
					<div className="flex items-center gap-3 text-red-600 mb-4">
						<AlertCircle className="w-6 h-6" />
						<h2 className="text-xl font-semibold">Error</h2>
					</div>
					<p className="text-gray-700 mb-6">{error}</p>
					<button
						onClick={() => navigate("/")}
						className="w-full py-3 px-4 bg-[#63A361] text-white rounded-lg hover:bg-[#63A361] transition-colors font-medium"
					>
						Go to Home
					</button>
				</div>
			</div>
		);
	}

	if (!quoteData) {
		return null;
	}

	return (
		<div className="min-h-screen bg-gray-50 py-12 px-4">
			<div className="max-w-3xl mx-auto">
				{/* Business Header */}
				{quoteData.adminId && (
					<div className="bg-white border border-gray-200 rounded-lg mb-6">
						<div className="px-8 py-6">
							<div className="flex items-start gap-6">
								{quoteData.adminId.businessLogo && !logoError ? (
									<div className="shrink-0">
										<img
											src={quoteData.adminId.businessLogo}
											alt={
												quoteData.adminId.businessName || quoteData.adminId.name
											}
											className="w-20 h-20 object-contain rounded-lg border border-gray-200"
											onError={() => setLogoError(true)}
										/>
									</div>
								) : (
									<div className="w-20 h-20 bg-slate-100 rounded-lg border border-gray-200 flex items-center justify-center shrink-0">
										<FileText className="w-10 h-10 text-slate-400" />
									</div>
								)}
								<div className="flex-1 min-w-0">
									<h2 className="text-2xl font-bold text-gray-900 mb-1">
										{quoteData.adminId.businessName || quoteData.adminId.name}
									</h2>
									{quoteData.adminId.businessName && quoteData.adminId.name && (
										<p className="text-sm text-gray-600 mb-2">
											{quoteData.adminId.name}
										</p>
									)}
									{quoteData.adminId.businessAddress && (
										<p className="text-sm text-gray-500 leading-relaxed">
											{quoteData.adminId.businessAddress}
										</p>
									)}
									{quoteData.adminId.email && (
										<p className="text-sm text-gray-500 mt-1">
											{quoteData.adminId.email}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>
				)}

				{/* Header Section */}
				<div className="mb-8">
					<div className="flex items-center gap-3 mb-3">
						<div className="w-10 h-10 bg-[#63A361] rounded-lg flex items-center justify-center">
							<FileText className="w-6 h-6 text-white" />
						</div>
						<h1 className="text-3xl font-bold text-gray-900">
							Quote Confirmation
						</h1>
					</div>
					<p className="text-gray-600 text-lg">
						Review your quote details and proceed with payment to confirm your
						order.
					</p>
				</div>

				{/* Quote Details Card */}
				<div className="bg-white border border-gray-200 rounded-lg mb-6">
					{/* Card Header */}
					<div className="border-b border-gray-200 px-8 py-6">
						<h2 className="text-xl font-semibold text-gray-900">
							Order Information
						</h2>
					</div>

					{/* Card Body */}
					<div className="px-8 py-6">
						<div className="space-y-6">
							{quoteData.orderDescription && (
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
										Order Description
									</label>
									<p className="text-gray-900 text-base leading-relaxed">
										{quoteData.orderDescription}
									</p>
								</div>
							)}

							{quoteData.quantity && (
								<div>
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
										Quantity
									</label>
									<p className="text-gray-900 text-base font-medium">
										{quoteData.quantity}
									</p>
								</div>
							)}

							<div>
								<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
									Specifications
								</label>
								<p className="text-gray-900 text-base leading-relaxed whitespace-pre-wrap">
									{quoteData.specifications}
								</p>
							</div>

							{quoteData.internalNotes && (
								<div className="pt-4 border-t border-gray-100">
									<label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
										Additional Notes
									</label>
									<p className="text-gray-600 text-sm leading-relaxed italic">
										{quoteData.internalNotes}
									</p>
								</div>
							)}
						</div>
					</div>
				</div>

				{/* Price Summary Card */}
				<div className="bg-white border border-gray-200 rounded-lg mb-6">
					<div className="px-8 py-6">
						<div className="flex items-center justify-between">
							<span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
								Total Amount
							</span>
							<span className="text-3xl font-bold text-[#63A361]">
								₵{quoteData.totalPrice.toFixed(2)}
							</span>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="bg-white border border-gray-200 rounded-lg p-6">
					<div className="flex flex-col sm:flex-row gap-4">
						<button
							onClick={() => navigate("/")}
							disabled={loading}
							className="flex-1 py-3.5 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
						>
							Cancel
						</button>
						<button
							onClick={handleConfirmPayment}
							disabled={
								loading ||
								!quoteData.adminId?.businessPaystackSubaccountCode ||
								!user
							}
							className="flex-1 py-3.5 px-6 bg-[#63A361] text-white rounded-lg font-semibold hover:bg-[#63A361] active:bg-[#63A361] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{loading ? (
								<>
									<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
									Processing...
								</>
							) : (
								<>
									<CheckCircle className="w-5 h-5" />
									Confirm Payment
								</>
							)}
						</button>
					</div>
				</div>

				{/* Payment Modal */}
				{showPaymentModal &&
					quoteData?.adminId?.businessPaystackSubaccountCode &&
					user &&
					quoteData && (
						<PaymentModal
							isOpen={showPaymentModal}
							onClose={() => {
								setShowPaymentModal(false);
							}}
							amount={Number(quoteData.totalPrice)}
							email={user.email}
							subaccount={quoteData.adminId.businessPaystackSubaccountCode}
							onPaymentSuccess={handlePaymentSuccess}
							onPaymentError={handlePaymentError}
						/>
					)}
			</div>
		</div>
	);
};


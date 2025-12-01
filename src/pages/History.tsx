import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getClientOrders } from '../services/orderApi';
import type { Category } from '../types/category';

interface OrderDetails {
  artwork: string;
  width: string;
  height: string;
  quantity: string;
  location: string;
  description?: string;
}

interface Submission {
  id: string;
  timestamp: string;
  file: {
    name: string;
    size: number;
  };
  orderDetails: OrderDetails;
  status: 'pending' | 'completed' | 'failed';
  category?: {
    name: string;
    unitPrice: number;
  };
}

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
	timestamp?: string;
	pdfFile?: {
		originalname?: string;
		size?: number;
	};
	fileName?: string;
	fileSize?: number;
	file?: {
		name?: string;
		size?: number;
	};
	artwork?: string;
	width?: string;
	height?: string;
	quantity?: number | string;
	location?: string;
	description?: string;
	status?: string;
	categoryId?: Category | {
		_id?: string;
		name?: string;
		unitPrice?: number;
		categoryType?: string;
	};
	executedBy?: ExecutedBy | string;
	executedByModel?: string;
	indexNumber?: string;
	yearOfCompletion?: string;
	dateOfBirth?: string;
	categoryType?: string;
}

export const History = () => {
	const { user } = useAuth();
	const navigate = useNavigate();
	const [submissions, setSubmissions] = useState<Submission[]>([]);
	const [filter, setFilter] = useState<
		"all" | "pending" | "completed" | "failed"
	>("all");
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadSubmissions = useCallback(async () => {
		if (!user?._id) {
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		setError(null);

		try {
			const response = await getClientOrders(user?._id);

			if (response.success && response.data?.orders) {
				// Map backend orders to Submission interface
				const mappedSubmissions: Submission[] = response.data.orders.map(
					(order: unknown) => {
						const orderData = order as Order;
						const category = orderData.categoryId;
						const categoryObj = typeof category === 'object' && category !== null ? category : null;
						
						return {
							id: orderData._id || orderData.id || Date.now().toString(),
							timestamp:
								orderData.createdAt ||
								orderData.timestamp ||
								new Date().toISOString(),
							file: {
								name:
									orderData.pdfFile?.originalname ||
									orderData.fileName ||
									orderData.file?.name ||
									"Results Checker",
								size:
									orderData.pdfFile?.size ||
									orderData.fileSize ||
									orderData.file?.size ||
									0,
							},
							orderDetails: {
								artwork: orderData.artwork || "",
								width: orderData.width || "",
								height: orderData.height || "",
								quantity: orderData.quantity?.toString() || "1",
								location: orderData.location || "",
								description: orderData.description || "",
							},
							status: (orderData.status || "pending") as
								| "pending"
								| "completed"
								| "failed",
							category: categoryObj ? {
								name: categoryObj.name || 'Unknown Category',
								unitPrice: categoryObj.unitPrice || 0,
							} : undefined,
						};
					}
				);

				setSubmissions(mappedSubmissions);
			} else {
				setSubmissions([]);
			}
		} catch (err: unknown) {
			console.error("Error loading submissions:", err);
			const errorMessage =
				err instanceof Error
					? err.message
					: "Failed to load submission history";
			setError(errorMessage);
			// Fallback to localStorage if API fails
			const stored = localStorage.getItem("submissions");
			if (stored) {
				try {
					setSubmissions(JSON.parse(stored));
				} catch (parseError) {
					console.error("Error parsing localStorage submissions:", parseError);
				}
			}
		} finally {
			setIsLoading(false);
		}
	}, [user?._id]);

	useEffect(() => {
		if (user?._id) {
			loadSubmissions();
		} else {
			setIsLoading(false);
		}
	}, [user?._id, loadSubmissions]);

	const formatDate = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="w-5 h-5 text-green-600" />;
			case "failed":
				return <XCircle className="w-5 h-5 text-red-600" />;
			default:
				return <Clock className="w-5 h-5 text-yellow-600" />;
		}
	};

	const getStatusBadge = (status: string) => {
		const styles = {
			pending: "bg-yellow-100 text-yellow-800",
			completed: "bg-green-100 text-green-800",
			failed: "bg-red-100 text-red-800",
		};

		return (
			<span
				className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
					styles[status as keyof typeof styles]
				}`}
			>
				{status.charAt(0).toUpperCase() + status.slice(1)}
			</span>
		);
	};

	const filteredSubmissions = submissions.filter(
		(sub) => filter === "all" || sub.status === filter
	);

	return (
		<div className="w-full max-w-6xl mx-auto">
			<div className="rounded-2xl p-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-4">
					<div>
						<h2 className="text-xl sm:text-2xl font-bold text-gray-900">
							Submission History
						</h2>
						<p className="text-xs sm:text-sm text-gray-600 mt-1">
							View all your print job submissions
						</p>
					</div>
					<div className="flex flex-row flex-wrap gap-2">
						<button
							onClick={() => setFilter("all")}
							className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
								filter === "all"
									? "bg-slate-700 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							All
						</button>
						<button
							onClick={() => setFilter("pending")}
							className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
								filter === "pending"
									? "bg-slate-700 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Pending
						</button>
						<button
							onClick={() => setFilter("completed")}
							className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
								filter === "completed"
									? "bg-slate-700 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Completed
						</button>
						<button
							onClick={() => setFilter("failed")}
							className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
								filter === "failed"
									? "bg-slate-700 text-white"
									: "bg-gray-100 text-gray-700 hover:bg-gray-200"
							}`}
						>
							Failed
						</button>
					</div>
				</div>

				{error && (
					<div className="mb-4 p-4 bg-red-50 text-red-800 rounded-lg flex items-start">
						<AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
						<div>
							<p className="text-sm font-medium">Error loading submissions</p>
							<p className="text-xs mt-1">{error}</p>
						</div>
					</div>
				)}

				{isLoading ? (
					<div className="text-center py-8 sm:py-12">
						<div className="w-12 h-12 sm:w-16 sm:h-16 border-4 border-slate-700 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
						<p className="text-gray-500 text-base sm:text-lg font-medium">
							Loading submissions...
						</p>
					</div>
				) : filteredSubmissions.length === 0 ? (
					<div className="text-center py-8 sm:py-12">
						<FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
						<p className="text-gray-500 text-base sm:text-lg font-medium">
							No submissions found
						</p>
						<p className="text-gray-400 text-xs sm:text-sm mt-2 px-4">
							{filter === "all"
								? "Submit your first print job to see it here"
								: `No ${filter} submissions found`}
						</p>
					</div>
				) : (
					<div className="space-y-3 sm:space-y-4">
						{filteredSubmissions.map((submission) => (
							<div
								key={submission.id}
								onClick={() => navigate(`/order/${submission.id}`)}
								className="border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-all cursor-pointer hover:border-indigo-300"
							>
								<div className="flex items-center justify-between gap-3">
									<div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
										<div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
											<FileText className="w-5 h-5 sm:w-6 sm:h-6 text-slate-700" />
										</div>
										<div className="flex-1 min-w-0">
											<h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate mb-1">
												{submission.category?.name || submission.orderDetails.artwork || "Print Order"}
											</h3>
											<div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
												<Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
												<span>{formatDate(submission.timestamp)}</span>
											</div>
										</div>
									</div>
									<div className="flex items-center gap-2 shrink-0">
										{getStatusBadge(submission.status)}
										{getStatusIcon(submission.status)}
									</div>
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
};


import { MapPin, ExternalLink, MessageSquare } from "lucide-react";
import { getStatusBadge, formatDate } from "../../utils/orderUtils";
import type { OrderStatus } from "../../services/orderApi";

interface OrderHeaderProps {
	status?: string | OrderStatus;
	totalPrice?: number;
	createdAt?: string;
	hasLocation: boolean;
	onGetDirections: () => void;
	onReportIssue: () => void;
}

export const OrderHeader = ({
	status,
	totalPrice,
	createdAt,
	hasLocation,
	onGetDirections,
	onReportIssue,
}: OrderHeaderProps) => {
	return (
		<div className="mb-5">
			<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
				<div className="flex-1">
					<h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-3">
						Order Details
					</h1>
					<div className="flex flex-wrap items-center gap-3">
						{status && (
							<div>
								<p className="text-xs text-gray-500 mb-1">Status</p>
								{getStatusBadge(status)}
							</div>
						)}
						{totalPrice !== undefined && (
							<div>
								<p className="text-xs text-gray-500 mb-1">Total Amount</p>
								<p className="text-xl lg:text-2xl font-bold text-[#63A361]">
									GHS {totalPrice.toFixed(2)}
								</p>
							</div>
						)}
						{createdAt && (
							<div>
								<p className="text-xs text-gray-500 mb-1">Order Date</p>
								<p className="text-sm font-semibold text-gray-900">
									{formatDate(createdAt)}
								</p>
							</div>
						)}
					</div>
				</div>
				<div className="flex flex-col sm:flex-row gap-3 shrink-0">
					{hasLocation && (
						<button
							onClick={onGetDirections}
							className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#63A361] text-white rounded-lg hover:bg-[#5a9458] transition-colors text-sm font-semibold border-2 border-[#63A361]"
						>
							<MapPin className="w-4 h-4" />
							Get Directions
							<ExternalLink className="w-3 h-3" />
						</button>
					)}
					<button
						onClick={onReportIssue}
						className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-white text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-semibold border-2 border-red-600"
					>
						<MessageSquare className="w-4 h-4" />
						Report Issue
					</button>
				</div>
			</div>
		</div>
	);
};


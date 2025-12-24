import { getStatusBadge, formatDate } from "../../utils/orderUtils";
import type { OrderStatus } from "../../services/orderApi";

interface OrderSummaryProps {
	status?: string | OrderStatus;
	createdAt?: string;
	submittedBy?: string;
	executedByModel?: string;
}

export const OrderSummary = ({
	status,
	createdAt,
	submittedBy,
	executedByModel,
}: OrderSummaryProps) => {
	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3">
				Order Summary
			</h3>
			<div className="space-y-4">
				{status && (
					<div>
						<p className="text-xs text-gray-500 mb-2">Status</p>
						{getStatusBadge(status)}
					</div>
				)}
				{createdAt && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Created At</p>
						<p className="text-sm font-semibold text-gray-900">
							{formatDate(createdAt)}
						</p>
					</div>
				)}
				{submittedBy && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Submitted By</p>
						<p className="text-sm font-semibold text-gray-900">
							{submittedBy}
						</p>
					</div>
				)}
				{executedByModel && (
					<div>
						<p className="text-xs text-gray-500 mb-1">Executed By Model</p>
						<p className="text-sm font-semibold text-gray-900">
							{executedByModel}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


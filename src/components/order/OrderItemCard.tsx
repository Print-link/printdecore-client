import { FileText } from "lucide-react";
import type { OrderItem, FileInfo } from "../../services/orderApi";
import { formatFileSize } from "../../utils/orderUtils";

interface OrderItemCardProps {
	item: OrderItem;
	index: number;
}

export const OrderItemCard = ({ item, index }: OrderItemCardProps) => {
	const filePages = item.options?.filePages;
	const hasFilePages = typeof filePages === 'number' && filePages > 0;

	return (
		<div className="border-2 border-gray-200 rounded-lg p-3">
			<div className="flex items-start justify-between mb-2">
				<div className="flex-1">
					<h4 className="text-sm font-semibold text-gray-900 mb-1">
						Item {index + 1}
					</h4>
					<div className="space-y-1 text-xs text-gray-600">
						{item.width && item.height && (
							<div>
								Dimensions: {item.width} × {item.height} {item.measurementUnit}
							</div>
						)}
						<div>Quantity: {item.quantity}</div>
						{hasFilePages && (
							<div>PDF Pages: {filePages}</div>
						)}
					</div>
				</div>
				<div className="text-right">
					<p className="text-sm font-bold text-[#fbbf24]">
						GHS {item.calculatedPrice.toFixed(2)}
					</p>
				</div>
			</div>
			
			{/* Options */}
			{(item.options?.frontBack || item.options?.color || item.options?.printCut) && (
				<div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
					{item.options.frontBack && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Front & Back
						</span>
					)}
					{item.options.color && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Color
						</span>
					)}
					{item.options.printCut && (
						<span className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded">
							Print & Cut
						</span>
					)}
				</div>
			)}

			{/* Files */}
			{item.options?.files && item.options.files.length > 0 && (
				<div className="mt-2 pt-2 border-t border-gray-200">
					<p className="text-xs text-gray-500 mb-1">Files ({item.options.files.length}):</p>
					<div className="space-y-1">
						{item.options.files.map((file, fileIndex) => {
							const fileInfo = file as FileInfo;
							return (
								<div key={fileIndex} className="flex items-center gap-2 text-xs">
									<FileText className="w-3 h-3 text-gray-400" />
									<a
										href={fileInfo.url}
										target="_blank"
										rel="noopener noreferrer"
										className="text-[#fbbf24] hover:underline truncate"
									>
										{fileInfo.name || `File ${fileIndex + 1}`}
									</a>
									{fileInfo.bytes && (
										<span className="text-gray-500">
											({formatFileSize(fileInfo.bytes)})
										</span>
									)}
								</div>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
};


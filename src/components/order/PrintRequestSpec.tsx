import { Link } from "react-router-dom";
import { ClipboardText } from "@phosphor-icons/react";
import { toOrderFiles } from "../../utils/files";
import { FileList } from "./FileList";
import { detailLines, type PrintRequest } from "../../services/printRequestApi";

interface PrintRequestSpecProps {
	request: PrintRequest;
}

/**
 * What the customer asked for on a request (often built with the Print Assistant):
 * the spec they confirmed, line by line, and the files they attached.
 */
export const PrintRequestSpec = ({ request }: PrintRequestSpecProps) => {
	const lines = detailLines(request.additionalDetails);
	const pages = request.pages ?? request.filePages;

	return (
		<div className="bg-white dark:bg-[#1e1e1e] rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
			<div className="flex items-center justify-between gap-3 mb-4">
				<div className="flex items-center gap-3 min-w-0">
					<div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center shrink-0">
						<ClipboardText size={16} weight="duotone" className="text-white" />
					</div>
					<div className="min-w-0">
						<h3 className="text-base font-bold text-gray-900 dark:text-white break-words">
							{request.quantity ? `${request.quantity.toLocaleString()} × ` : ""}
							{request.serviceName ?? "Your request"}
						</h3>
						<p className="text-xs text-gray-500">Request {request.requestNumber}</p>
					</div>
				</div>
				<Link to={`/home/print-request/${request.id}`} className="text-xs font-semibold text-[#d97706] hover:underline shrink-0">
					Messages
				</Link>
			</div>

			{lines.length > 0 && (
				<ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300 list-disc pl-5">
					{lines.map((line, i) => (
						<li key={i}>{line}</li>
					))}
				</ul>
			)}

			<dl className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
				{pages !== undefined && (
					<div>
						<dt className="inline text-gray-500">Pages: </dt>
						<dd className="inline">{pages}</dd>
					</div>
				)}
				<div>
					<dt className="inline text-gray-500">{request.fulfilmentType === "pickup" ? "Pickup" : "Delivery"}: </dt>
					<dd className="inline">{request.fulfilmentType === "pickup" ? "you'll collect it" : request.deliveryAddress}</dd>
				</div>
			</dl>

			{request.attachments.length > 0 && (
				<div className="mt-4">
					<FileList files={toOrderFiles(request.attachments)} title="Your files" />
				</div>
			)}
		</div>
	);
};

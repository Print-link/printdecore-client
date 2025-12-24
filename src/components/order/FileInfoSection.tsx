import { FileText } from "lucide-react";
import { formatFileSize } from "../../utils/orderUtils";

interface FileInfoSectionProps {
	fileName?: string;
	originalName?: string;
	fileSize?: number;
}

export const FileInfoSection = ({
	fileName,
	originalName,
	fileSize,
}: FileInfoSectionProps) => {
	return (
		<div className="bg-white rounded-lg border-2 border-gray-200 p-4">
			<h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
				<FileText className="w-5 h-5" />
				File Information
			</h3>
			<div className="space-y-3">
				<div>
					<p className="text-xs text-gray-500 mb-1">File Name</p>
					<p className="text-sm sm:text-base font-medium text-gray-900 break-word">
						{fileName || originalName || "N/A"}
					</p>
				</div>
				{fileSize && (
					<div>
						<p className="text-xs text-gray-500 mb-1">File Size</p>
						<p className="text-sm sm:text-base font-medium text-gray-900">
							{formatFileSize(fileSize)}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


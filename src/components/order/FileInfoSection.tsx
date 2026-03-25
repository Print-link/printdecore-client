import { FileText } from "@phosphor-icons/react";
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
		<div className="bg-white dark:bg-[#1e1e1e] rounded-lg border-2 border-gray-200 dark:border-gray-700 p-4">
			<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
				<FileText size={20} weight="duotone" />
				File Information
			</h3>
			<div className="space-y-3">
				<div>
					<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">File Name</p>
					<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white break-word">
						{fileName || originalName || "N/A"}
					</p>
				</div>
				{fileSize && (
					<div>
						<p className="text-xs text-gray-500 dark:text-gray-400 mb-1">File Size</p>
						<p className="text-sm sm:text-base font-medium text-gray-900 dark:text-white">
							{formatFileSize(fileSize)}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


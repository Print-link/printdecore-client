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
		<div className="bg-surface rounded-lg border-2 border-line p-4">
			<h3 className="text-lg font-bold title-tight text-ink mb-3 flex items-center gap-2">
				<FileText size={20} weight="regular" />
				File Information
			</h3>
			<div className="space-y-3">
				<div>
					<p className="text-xs text-ink-2 mb-1">File Name</p>
					<p className="text-sm sm:text-base font-medium text-ink break-word">
						{fileName || originalName || "N/A"}
					</p>
				</div>
				{fileSize && (
					<div>
						<p className="text-xs text-ink-2 mb-1">File Size</p>
						<p className="text-sm sm:text-base font-medium text-ink">
							{formatFileSize(fileSize)}
						</p>
					</div>
				)}
			</div>
		</div>
	);
};


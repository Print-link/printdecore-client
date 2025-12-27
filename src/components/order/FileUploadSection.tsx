import { FileText, Upload, X } from "lucide-react";

interface FileUploadSectionProps {
	selectedFiles: File[];
	onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onFileRemove: (index: number) => void;
	isPageBased: boolean;
	pdfPageCount?: number;
	countingPages: boolean;
}

export const FileUploadSection = ({
	selectedFiles,
	onFileSelect,
	onFileRemove,
	isPageBased,
	pdfPageCount,
	countingPages,
}: FileUploadSectionProps) => {
	return (
		<div>
			<label className="block text-sm sm:text-base font-medium text-gray-700 mb-2 sm:mb-3">
				Upload {isPageBased ? "PDF File" : "Files"} *
			</label>
			<div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center">
				{isPageBased ? (
					<FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
				) : (
					<Upload className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2 sm:mb-3" />
				)}
				<input
					type="file"
					multiple={!isPageBased}
					accept={isPageBased ? "application/pdf,.pdf" : "image/*,application/pdf,.ai,.psd"}
					onChange={onFileSelect}
					className="hidden"
					id="file-upload"
				/>
				<label
					htmlFor="file-upload"
					className="cursor-pointer text-xs sm:text-sm text-[#fbbf24] hover:text-[#d97706] font-medium transition-colors block"
				>
					Click to upload or drag and drop
				</label>
				<p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
					{isPageBased
						? "PDF files only, up to 10MB"
						: "PNG, JPG, PDF, AI, PSD up to 10MB"}
				</p>
			</div>

			{/* Selected Files */}
			{selectedFiles.length > 0 && (
				<div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3">
					{selectedFiles.map((file, index) => {
						const isPdf =
							file.type === "application/pdf" ||
							file.name?.toLowerCase().endsWith(".pdf");
						return (
							<div
								key={index}
								className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg"
							>
								<div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
									{isPdf && <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />}
									<div className="flex-1 min-w-0">
										<p className="text-xs sm:text-sm font-medium text-gray-900 truncate">
											{file.name}
										</p>
										<div className="flex items-center gap-2 sm:gap-3 mt-0.5 sm:mt-1 flex-wrap">
											<p className="text-xs text-gray-500">
												{(file.size / 1024 / 1024).toFixed(2)} MB
											</p>
											{isPdf && countingPages && index === 0 && (
												<span className="text-xs text-gray-500">
													• Counting pages...
												</span>
											)}
											{isPdf && pdfPageCount !== undefined && index === 0 && (
												<span className="text-xs text-[#fbbf24] font-medium">
													• {pdfPageCount} {pdfPageCount === 1 ? "page" : "pages"}
												</span>
											)}
										</div>
									</div>
								</div>
								<button
									type="button"
									onClick={() => onFileRemove(index)}
									className="self-start sm:self-auto ml-auto sm:ml-0 p-1.5 sm:p-1 text-red-600 hover:text-red-700 transition-colors rounded"
									aria-label="Remove file"
								>
									<X className="w-4 h-4 sm:w-5 sm:h-5" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};


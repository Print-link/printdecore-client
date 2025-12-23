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
			<label className="block text-sm font-medium text-gray-700 mb-2">
				Upload {isPageBased ? "PDF File" : "Files"} *
			</label>
			<div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
				{isPageBased ? (
					<FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
				) : (
					<Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
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
					className="cursor-pointer text-sm text-[#fbbf24] hover:text-[#fbbf24]"
				>
					Click to upload or drag and drop
				</label>
				<p className="text-xs text-gray-500 mt-1">
					{isPageBased
						? "PDF files only, up to 10MB"
						: "PNG, JPG, PDF, AI, PSD up to 10MB"}
				</p>
			</div>

			{/* Selected Files */}
			{selectedFiles.length > 0 && (
				<div className="mt-4 space-y-2">
					{selectedFiles.map((file, index) => {
						const isPdf =
							file.type === "application/pdf" ||
							file.name?.toLowerCase().endsWith(".pdf");
						return (
							<div
								key={index}
								className="flex items-center justify-between p-2 bg-gray-50 rounded"
							>
								<div className="flex items-center gap-2 flex-1">
									{isPdf && <FileText className="w-4 h-4 text-red-600" />}
									<span className="text-sm text-gray-700">{file.name}</span>
									{isPdf && countingPages && index === 0 && (
										<span className="text-xs text-gray-500">
											(Counting pages...)
										</span>
									)}
									{isPdf && pdfPageCount !== undefined && index === 0 && (
										<span className="text-xs text-[#fbbf24] font-medium">
											({pdfPageCount} {pdfPageCount === 1 ? "page" : "pages"})
										</span>
									)}
								</div>
								<button
									type="button"
									onClick={() => onFileRemove(index)}
									className="text-red-600 hover:text-red-700 ml-2"
								>
									<X className="w-4 h-4" />
								</button>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};


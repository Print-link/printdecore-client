import { useState } from "react";
import { Upload, FileText, X, Calculator } from "lucide-react";
import type { Category } from "../../types/category";

interface FormatPrintFormProps {
	category: Category;
	onFileSelect: (file: File) => void;
	onFileRemove: () => void;
	selectedFile: File | null;
	onWidthChange: (width: string) => void;
	onHeightChange: (height: string) => void;
	onCopiesChange: (copies: string) => void;
	width: string;
	height: string;
	numberOfCopies: string;
	dragActive: boolean;
	onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
	formatFileSize: (bytes: number) => string;
	loading: boolean;
	pdfPageCount?: number;
	totalPrice?: number;
}

export const FormatPrintForm = ({
	category,
	onFileSelect,
	onFileRemove,
	selectedFile,
	onWidthChange,
	onHeightChange,
	onCopiesChange,
	width,
	height,
	numberOfCopies,
	dragActive,
	onDrag,
	onDrop,
	formatFileSize,
	loading,
	pdfPageCount,
	totalPrice,
}: FormatPrintFormProps) => {
	const isLargeFormat = category.categoryType === "large_format";
	const isRegularFormat = category.categoryType === "regular_format";
	const regularFormatProperties = category.regularFormatProperties;

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			onFileSelect(e.target.files[0]);
		}
	};

	// Determine accepted file types based on category
	const acceptedFileTypes = isRegularFormat ? ".pdf" : ".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx";
	const supportedFormatsText = isRegularFormat 
		? "Supported format: PDF only"
		: "Supported formats: PDF, Images (PNG, JPG), Documents (DOC, DOCX, XLS, XLSX, PPT, PPTX)";

	return (
		<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
			{/* Left Column - Upload Area */}
			<div>
				<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
					Upload File
				</h3>
				<div
					className={`relative border-2 border-dashed rounded-xl p-4 sm:p-6 transition-all ${
						dragActive
							? "border-slate-500 bg-slate-50"
							: "border-gray-300 bg-gray-50"
					}`}
					onDragEnter={onDrag}
					onDragLeave={onDrag}
					onDragOver={onDrag}
					onDrop={onDrop}
				>
					{!selectedFile ? (
						<div className="text-center">
							<Upload className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400 mx-auto mb-2 sm:mb-3" />
							<p className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">
								Drag and drop your file here
							</p>
							<p className="text-xs text-gray-500 mb-2 sm:mb-3">or</p>
							<label className="inline-flex items-center px-4 py-2.5 sm:py-2 bg-slate-700 text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-slate-800 transition-colors touch-manipulation">
								<Upload className="w-4 h-4 mr-2" />
								Browse Files
								<input
									type="file"
									accept={acceptedFileTypes}
									onChange={handleFileInputChange}
									className="hidden"
									disabled={loading}
								/>
							</label>
							<p className="text-xs text-gray-400 mt-2 sm:mt-3 px-2">
								{supportedFormatsText}
							</p>
						</div>
					) : (
						<div className="flex items-center justify-between bg-white rounded-lg p-2 sm:p-3 border border-gray-200">
							<div className="flex items-center flex-1 min-w-0 pr-2">
								<div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center mr-2 sm:mr-3 shrink-0">
									<FileText className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
										{selectedFile.name}
									</p>
									<p className="text-xs text-gray-500">
										{formatFileSize(selectedFile.size)}
									</p>
								</div>
							</div>
							<button
								type="button"
								onClick={onFileRemove}
								className="ml-2 p-2 sm:p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation shrink-0"
								disabled={loading}
								aria-label="Remove file"
							>
								<X className="w-5 h-5 sm:w-4 sm:h-4" />
							</button>
						</div>
					)}
				</div>
			</div>

			{/* Right Column - Format Details */}
			<div>
				<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
					{isLargeFormat ? "Large Format Details" : "Print Details"}
				</h3>
				<div className="space-y-3 sm:space-y-4">
					{isLargeFormat && (
						<>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5">
									Width *
								</label>
								<input
									type="text"
									value={width}
									onChange={(e) => onWidthChange(e.target.value)}
									placeholder="e.g., 9x6m"
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
									required
									disabled={loading}
								/>
							</div>
							<div>
								<label className="block text-sm font-medium text-gray-700 mb-1.5">
									Height *
								</label>
								<input
									type="text"
									value={height}
									onChange={(e) => onHeightChange(e.target.value)}
									placeholder="e.g., 6m"
									className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
									required
									disabled={loading}
								/>
							</div>
						</>
					)}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Number of Copies *
						</label>
						<input
							type="number"
							value={numberOfCopies}
							onChange={(e) => onCopiesChange(e.target.value)}
							min="1"
							placeholder="Enter number of copies"
							className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					{/* Price Calculation for Regular Format */}
					{isRegularFormat && selectedFile && regularFormatProperties && (
						<div className="bg-green-50 border border-green-200 rounded-lg p-4">
							<div className="flex items-center gap-2 mb-2">
								<Calculator className="w-5 h-5 text-green-600" />
								<h4 className="text-sm font-semibold text-green-900">Price Calculation</h4>
							</div>
							{pdfPageCount === undefined ? (
								<div className="text-xs sm:text-sm text-gray-600">
									<p>Reading PDF to calculate price...</p>
								</div>
							) : totalPrice !== undefined ? (
								<div className="space-y-1.5 text-xs sm:text-sm">
									<div className="flex justify-between text-gray-700">
										<span>PDF Pages:</span>
										<span className="font-medium">{pdfPageCount}</span>
									</div>
									{regularFormatProperties === "front_and_back" && (
										<div className="flex justify-between text-gray-700">
											<span>Sheets (2 pages/sheet):</span>
											<span className="font-medium">{Math.ceil(pdfPageCount / 2)}</span>
										</div>
									)}
									<div className="flex justify-between text-gray-700">
										<span>Unit Price:</span>
										<span className="font-medium">GHS {category.unitPrice.toFixed(2)}</span>
									</div>
									<div className="flex justify-between text-gray-700">
										<span>Copies:</span>
										<span className="font-medium">{numberOfCopies}</span>
									</div>
									<div className="pt-2 mt-2 border-t border-green-200 flex justify-between items-center">
										<span className="font-semibold text-green-900">Total Amount:</span>
										<span className="text-lg font-bold text-green-700">GHS {totalPrice.toFixed(2)}</span>
									</div>
								</div>
							) : (
								<div className="text-xs sm:text-sm text-gray-600">
									<p>Enter number of copies to calculate price</p>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};


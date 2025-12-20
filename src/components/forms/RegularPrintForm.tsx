import { Upload, FileText, X } from "lucide-react";

interface RegularPrintFormProps {
	onFileSelect: (file: File) => void;
	onFileRemove: () => void;
	selectedFile: File | null;
	onInputChange: (name: string, value: string) => void;
	orderDetails: {
		artwork: string;
		width: string;
		height: string;
		quantity: string;
		location: string;
		description: string;
	};
	dragActive: boolean;
	onDrag: (e: React.DragEvent<HTMLDivElement>) => void;
	onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
	formatFileSize: (bytes: number) => string;
	loading: boolean;
}

export const RegularPrintForm = ({
	onFileSelect,
	onFileRemove,
	selectedFile,
	onInputChange,
	orderDetails,
	dragActive,
	onDrag,
	onDrop,
	formatFileSize,
	loading,
}: RegularPrintFormProps) => {
	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			onFileSelect(e.target.files[0]);
		}
	};

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
							<label className="inline-flex items-center px-4 py-2.5 sm:py-2 bg-[#63A361] text-white rounded-lg text-sm font-semibold cursor-pointer hover:bg-[#63A361] transition-colors touch-manipulation">
								<Upload className="w-4 h-4 mr-2" />
								Browse Files
								<input
									type="file"
									accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
									onChange={handleFileInputChange}
									className="hidden"
									disabled={loading}
								/>
							</label>
							<p className="text-xs text-gray-400 mt-2 sm:mt-3 px-2">
								Supported formats: PDF, Images (PNG, JPG), Documents (DOC,
								DOCX, XLS, XLSX, PPT, PPTX)
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

			{/* Right Column - Order Details Form */}
			<div>
				<h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
					Job Order Details
				</h3>
				<div className="space-y-3 sm:space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Artwork (Company/Individual) *
						</label>
						<input
							type="text"
							name="artwork"
							value={orderDetails.artwork}
							onChange={(e) => onInputChange(e.target.name, e.target.value)}
							placeholder="e.g., Shell power to grow"
							className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-1.5">
								Width *
							</label>
							<input
								type="text"
								name="width"
								value={orderDetails.width}
								onChange={(e) => onInputChange(e.target.name, e.target.value)}
								placeholder="e.g., 9x6m"
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
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
								name="height"
								value={orderDetails.height}
								onChange={(e) => onInputChange(e.target.name, e.target.value)}
								placeholder="e.g., 6m"
								className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
								required
								disabled={loading}
							/>
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Quantity *
						</label>
						<input
							type="number"
							name="quantity"
							value={orderDetails.quantity}
							onChange={(e) => onInputChange(e.target.name, e.target.value)}
							min="1"
							className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Location/Vendor *
						</label>
						<input
							type="text"
							name="location"
							value={orderDetails.location}
							onChange={(e) => onInputChange(e.target.name, e.target.value)}
							placeholder="e.g., T-Havannah 1, Accra Marriott"
							className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
							required
							disabled={loading}
						/>
					</div>

					<div>
						<label className="block text-sm font-medium text-gray-700 mb-1.5">
							Description (Optional)
						</label>
						<textarea
							name="description"
							value={orderDetails.description}
							onChange={(e) => onInputChange(e.target.name, e.target.value)}
							placeholder="Add any additional notes or specifications..."
							rows={3}
							className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent resize-none"
							disabled={loading}
						/>
					</div>
				</div>
			</div>
		</div>
	);
};


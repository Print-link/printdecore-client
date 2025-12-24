import { toast } from "react-toastify";
import { uploadFile, type FileInfo } from "../services/orderApi";

export const uploadOrderFiles = async (
	selectedFiles: File[]
): Promise<FileInfo[]> => {
	if (selectedFiles.length === 0) return [];

	const uploadedFiles: FileInfo[] = [];

	try {
		for (let i = 0; i < selectedFiles.length; i++) {
			const file = selectedFiles[i];
			const folder = `orders/temp/${Date.now()}`;

			const response = await uploadFile(file, folder);
			if (response.success && response.data) {
				uploadedFiles.push({
					url: response.data.url,
					publicId: response.data.publicId,
					name: file.name,
					size: file.size,
					type: file.type,
					width: response.data.width,
					height: response.data.height,
					format: response.data.format,
					bytes: response.data.bytes,
				});
			}
		}

		return uploadedFiles;
	} catch (err) {
		console.error("Error uploading files:", err);
		toast.error("Failed to upload files. Please try again.");
		return [];
	}
};


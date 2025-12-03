import { useState, useCallback } from "react";
import type { Category } from "../types/category";

interface UseFileHandlingProps {
	selectedCategory: Category | null;
	onFileError?: (message: string) => void;
}

export const useFileHandling = ({
	selectedCategory,
	onFileError,
}: UseFileHandlingProps) => {
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [dragActive, setDragActive] = useState(false);

	const validateAndSetFile = useCallback(
		(file: File) => {
			const isRegularFormatCategory =
				selectedCategory?.categoryType === "regular_format";

			const allowedExtensions = isRegularFormatCategory
				? [".pdf"]
				: [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"];

			const fileName = file.name.toLowerCase();
			const isAllowed = allowedExtensions.some((ext) => fileName.endsWith(ext));

			if (isAllowed) {
				setSelectedFile(file);
			} else {
				const errorMessage = isRegularFormatCategory
					? "Please upload a PDF file only"
					: "Please upload a valid file (PDF, Image, or Document)";
				onFileError?.(errorMessage);
			}
		},
		[selectedCategory, onFileError]
	);

	const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		if (e.type === "dragenter" || e.type === "dragover") {
			setDragActive(true);
		} else if (e.type === "dragleave") {
			setDragActive(false);
		}
	}, []);

	const handleDrop = useCallback(
		(e: React.DragEvent<HTMLDivElement>) => {
			e.preventDefault();
			e.stopPropagation();
			setDragActive(false);

			if (e.dataTransfer.files && e.dataTransfer.files[0]) {
				validateAndSetFile(e.dataTransfer.files[0]);
			}
		},
		[validateAndSetFile]
	);

	const removeFile = useCallback(() => {
		setSelectedFile(null);
	}, []);

	return {
		selectedFile,
		dragActive,
		setSelectedFile,
		validateAndSetFile,
		handleDrag,
		handleDrop,
		removeFile,
	};
};


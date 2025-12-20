import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { countPdfPages } from "../utils/pdfUtils";

export const usePdfPageCount = (selectedFiles: File[]) => {
	const [pdfPageCount, setPdfPageCount] = useState<number | undefined>(undefined);
	const [countingPages, setCountingPages] = useState<boolean>(false);

	useEffect(() => {
		const countPages = async () => {
			// Find the first PDF file
			const pdfFile = selectedFiles.find(
				(file) =>
					file.type === "application/pdf" ||
					file.name?.toLowerCase().endsWith(".pdf")
			);

			if (pdfFile) {
				setCountingPages(true);
				try {
					const pages = await countPdfPages(pdfFile);
					setPdfPageCount(pages);
				} catch (error) {
					console.error("Error counting PDF pages:", error);
					toast.error("Failed to read PDF file. Please ensure it's a valid PDF.");
					setPdfPageCount(undefined);
				} finally {
					setCountingPages(false);
				}
			} else {
				setPdfPageCount(undefined);
			}
		};

		countPages();
	}, [selectedFiles]);

	return { pdfPageCount, countingPages, setPdfPageCount };
};


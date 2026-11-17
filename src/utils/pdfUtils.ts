import { PDFDocument } from "pdf-lib";

/**
 * Count the number of pages in a PDF file using pdf-lib
 * @param file - The PDF file to count pages for
 * @returns Promise<number> - The number of pages in the PDF
 */
export const countPdfPages = async (file: File): Promise<number> => {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = async (e) => {
			try {
				const arrayBuffer = e.target?.result as ArrayBuffer;
				if (!arrayBuffer) {
					reject(new Error("Failed to read file"));
					return;
				}

				// Use pdf-lib to load and count pages
				// pdf-lib doesn't require workers and works seamlessly in the browser
				const pdfDoc = await PDFDocument.load(arrayBuffer);
				const pageCount = pdfDoc.getPageCount();
				resolve(pageCount);
			} catch (error) {
				console.error("Error counting PDF pages:", error);
				reject(error);
			}
		};

		reader.onerror = () => {
			reject(new Error("Failed to read file"));
		};

		reader.readAsArrayBuffer(file);
	});
};


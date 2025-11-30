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

/**
 * Calculate the total price for regular format printing
 * @param pageCount - Number of pages in the PDF
 * @param regularFormatProperties - "front_only" or "front_and_back"
 * @param unitPrice - Price per unit (page or sheet)
 * @param numberOfCopies - Number of copies to print
 * @returns The total price to be paid
 */
export const calculateRegularFormatPrice = (
	pageCount: number,
	regularFormatProperties: "front_only" | "front_and_back",
	unitPrice: number,
	numberOfCopies: number
): number => {
	if (regularFormatProperties === "front_only") {
		// front_only: pages × unitPrice × copies
		return pageCount * unitPrice * numberOfCopies;
	} else {
		// front_and_back: (pages / 2) × unitPrice × copies
		// Round up to handle odd number of pages (e.g., 5 pages = 3 sheets)
		const sheets = Math.ceil(pageCount / 2);
		return sheets * unitPrice * numberOfCopies;
	}
};


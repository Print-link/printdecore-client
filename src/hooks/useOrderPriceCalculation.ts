import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
	calculatePrice,
	type PriceCalculationResponse,
	type AgentService,
	type PriceCalculationRequest,
} from "../services/orderApi";
import type { MeasurementUnit } from "../services/orderApi";

interface OrderFormData {
	width?: number;
	height?: number;
	measurementUnit: MeasurementUnit;
	quantity: number;
	options: {
		frontBack?: boolean;
		color?: boolean;
		printCut?: boolean;
		frontOnly?: boolean;
		filePages?: number;
		numberOfPages?: number;
	};
}

interface UseOrderPriceCalculationProps {
	agentServiceId: string | null;
	formData: OrderFormData;
	agentService: AgentService | null;
	pdfPageCount?: number;
	selectedFilesLength: number;
}

export const useOrderPriceCalculation = ({
	agentServiceId,
	formData,
	agentService,
	pdfPageCount,
	selectedFilesLength,
}: UseOrderPriceCalculationProps) => {
	const [calculatingPrice, setCalculatingPrice] = useState<boolean>(false);
	const [priceInfo, setPriceInfo] = useState<PriceCalculationResponse | null>(
		null
	);
	const [formulaType, setFormulaType] = useState<string | null>(null);
	const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Memoize form data to prevent unnecessary recalculations
	const memoizedFormData = useMemo(
		() => formData,
		[
			formData.width,
			formData.height,
			formData.measurementUnit,
			formData.quantity,
			formData.options.frontBack,
			formData.options.color,
			formData.options.printCut,
			formData.options.frontOnly,
			formData.options.filePages,
			formData.options.numberOfPages,
		]
	);

	const calculatePriceAsync = useCallback(async () => {
		if (!agentServiceId || !memoizedFormData.quantity) return;

		setCalculatingPrice(true);
		try {
			// Build request payload - the API function will clean undefined values
			const options = { ...memoizedFormData.options };

			// If we have pdfPageCount, always include it in options (backend will use it if needed)
			// This ensures PAGE_BASED calculations work even if formulaType isn't set yet
			if (pdfPageCount && pdfPageCount > 0) {
				options.filePages = pdfPageCount;
				options.numberOfPages = pdfPageCount;
			}

			const requestPayload: PriceCalculationRequest = {
				width: memoizedFormData.width,
				height: memoizedFormData.height,
				measurementUnit: memoizedFormData.measurementUnit,
				quantity: memoizedFormData.quantity,
				options: Object.keys(options).length > 0 ? options : undefined,
			};

			const response = await calculatePrice(agentServiceId, requestPayload);

			if (response.success && response.data) {
				setPriceInfo(response.data);
				// Store formula type if not already set
				if (!formulaType && response.data.formulaType) {
					setFormulaType(response.data.formulaType);
				}
			}
		} catch (err) {
			console.error("Error calculating price:", err);
		} finally {
			setCalculatingPrice(false);
		}
	}, [
		agentServiceId,
		memoizedFormData,
		formulaType,
		pdfPageCount,
		priceInfo?.formulaType,
		agentService?.formulaType,
	]);

	// Get formula type directly from agentService if available
	useEffect(() => {
		if (agentService?.formulaType && !formulaType) {
			setFormulaType(agentService.formulaType);
		}
	}, [agentService, formulaType]);

	// Calculate price when form data changes (debounced)
	useEffect(() => {
		if (agentService && memoizedFormData.quantity > 0) {
			// For PAGE_BASED, wait for PDF pages to be counted
			const currentIsPageBased =
				formulaType === "PAGE_BASED" || priceInfo?.formulaType === "PAGE_BASED";
			if (currentIsPageBased && !pdfPageCount && selectedFilesLength > 0) {
				return; // Wait for page count
			}

			// For PAGE_BASED, ensure filePages is in options before making the call
			if (
				currentIsPageBased &&
				!memoizedFormData.options?.filePages &&
				!memoizedFormData.options?.numberOfPages
			) {
				if (!pdfPageCount) {
					return; // Wait for page count
				}
			}

			// Clear existing timer
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}

			// Debounce the API call
			debounceTimerRef.current = setTimeout(() => {
				calculatePriceAsync();
			}, 500); // 500ms debounce
		}

		return () => {
			if (debounceTimerRef.current) {
				clearTimeout(debounceTimerRef.current);
			}
		};
	}, [
		memoizedFormData,
		agentService,
		pdfPageCount,
		selectedFilesLength,
		calculatePriceAsync,
		formulaType,
		priceInfo?.formulaType,
	]);

	return {
		priceInfo,
		calculatingPrice,
		formulaType: formulaType || priceInfo?.formulaType,
	};
};


import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { calculatePrice, type PriceCalculationResponse } from "../services/orderApi";
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
	agentService: any;
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
	const [priceInfo, setPriceInfo] = useState<PriceCalculationResponse | null>(null);
	const [formulaType, setFormulaType] = useState<string | null>(null);
	const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
	const isInitialCallRef = useRef<boolean>(true);

	// Memoize form data to prevent unnecessary recalculations
	const memoizedFormData = useMemo(() => formData, [
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
	]);

	const calculatePriceAsync = useCallback(async () => {
		if (!agentServiceId || !memoizedFormData.quantity) return;

		setCalculatingPrice(true);
		try {
			const response = await calculatePrice(agentServiceId, {
				width: memoizedFormData.width,
				height: memoizedFormData.height,
				measurementUnit: memoizedFormData.measurementUnit,
				quantity: memoizedFormData.quantity,
				options: memoizedFormData.options,
			});

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
	}, [agentServiceId, memoizedFormData]);

	// Initial call to get formula type (only once when agentService is loaded)
	useEffect(() => {
		if (agentService && agentServiceId && !formulaType && isInitialCallRef.current) {
			isInitialCallRef.current = false;
			// Make initial call with minimal data just to get formulaType
			// For PAGE_BASED, we'll pass filePages: 1 to avoid validation errors
			calculatePrice(agentServiceId, {
				width: 1,
				height: 1,
				measurementUnit: "FEET",
				quantity: 1,
				options: {
					filePages: 1,
					numberOfPages: 1,
				},
			})
				.then((response) => {
					if (response.success && response.data?.formulaType) {
						setFormulaType(response.data.formulaType);
					}
				})
				.catch((err) => {
					console.error("Error getting formula type:", err);
					// If it fails, we'll get it from the first successful price calculation
				});
		}
	}, [agentService, agentServiceId, formulaType]);

	// Calculate price when form data changes (debounced)
	useEffect(() => {
		if (agentService && memoizedFormData.quantity > 0) {
			// For PAGE_BASED, wait for PDF pages to be counted
			const currentIsPageBased = formulaType === "PAGE_BASED" || priceInfo?.formulaType === "PAGE_BASED";
			if (currentIsPageBased && !pdfPageCount && selectedFilesLength > 0) {
				return; // Wait for page count
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

	return { priceInfo, calculatingPrice, formulaType: formulaType || priceInfo?.formulaType };
};


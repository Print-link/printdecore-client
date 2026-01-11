import type {
	PriceCalculationRequest,
	PriceCalculationResponse,
	AgentService,
	MeasurementUnit,
} from "../services/orderApi";

// Helper to calculate area in square feet
// For INCH: (W * H) / 144 = area in sqft
// For FEET: W * H = area in sqft
const calculateAreaInSqFt = (
	width: number,
	height: number,
	unit: MeasurementUnit
): number => {
	if (unit === "INCH") {
		// Convert square inches to square feet: divide by 144 (12 * 12)
		return (width * height) / 144;
	} else if (unit === "FEET") {
		// Already in square feet
		return width * height;
	} else if (unit === "UNIT") {
		// Treat as 1x1 for unit based if dimensions not provided, 
        // but usually UNIT based doesn't use this helper directly in same way
		return 0; 
	}

	return 0;
};

export const calculateOrderPriceFrontend = (
	agentService: AgentService,
	request: PriceCalculationRequest
): PriceCalculationResponse => {
	const quantity = request.quantity || 1;
	let calculatedPrice = 0;
	let basePrice = 0;
	let formulaType = agentService.formulaType || "UNIT_BASED"; // Default fallback
	const breakdown: PriceCalculationResponse["breakdown"] = {
		options: [],
		customSpecs: [],
	};

    // --- Flexible Pricing Calculation ---
	if (agentService.pricingConfig) {
		const config = agentService.pricingConfig;

		// Determine formula type
		const isPageBased =
			formulaType === "PAGE_BASED" || agentService.formulaType === "PAGE_BASED";
		const isAreaFeet =
			formulaType === "AREA_FEET" || agentService.formulaType === "AREA_FEET";
		const isAreaInch =
			formulaType === "AREA_INCH" || agentService.formulaType === "AREA_INCH";
		const isAreaOrUnit =
			formulaType === "AREA_OR_UNIT" || agentService.formulaType === "AREA_OR_UNIT";
		const isAreaBased = isAreaFeet || isAreaInch || isAreaOrUnit;

		const pagesPerCopy =
			request.filePages ||
			request.options?.filePages ||
			request.options?.numberOfPages ||
			0;

		// Handle double-sided (Front/Back) for page-based
		let effectiveUnits = pagesPerCopy;
		if (isPageBased && request.options?.frontBack) {
			effectiveUnits = Math.ceil(pagesPerCopy / 2);
		}

		// 1. Base Configuration Price
		let unitPrice = 0;
		if (request.selectedBaseConfigId) {
			const baseConfig = config.baseConfigurations.find(
				(c) => c.id === request.selectedBaseConfigId
			);
			if (baseConfig) {
				unitPrice = baseConfig.unitPrice;
				breakdown.baseConfiguration = {
					id: baseConfig.id,
					name: baseConfig.name,
					price: 0, // Will be set after calculation
				};
			}
		}

		// 2. Collect all modifiers by type (order-independent collection)
		// Formula: ((unitPrice + PER_UNIT options) * quantity * pageCount) + FIXED + PERCENTAGE
		let unitPriceWithModifiers = unitPrice;
		const perUnitModifiers: Array<{
			id: string;
			name: string;
			modifier: number;
			isOption: boolean;
		}> = [];
		const fixedModifiers: Array<{
			id: string;
			name: string;
			modifier: number;
			isOption: boolean;
		}> = [];
		const percentageModifiers: Array<{
			id: string;
			name: string;
			modifier: number;
			isOption: boolean;
		}> = [];

		// Collect PER_UNIT modifiers from options (these are added to unitPrice before multiplying)
		if (request.selectedOptions && request.selectedOptions.length > 0) {
			request.selectedOptions.forEach((optId) => {
				const option = config.options.find((o) => o.id === optId);
				if (option && option.modifierType === "PER_UNIT") {
					unitPriceWithModifiers += option.priceModifier;
					perUnitModifiers.push({
						id: option.id,
						name: option.name,
						modifier: option.priceModifier,
						isOption: true,
					});
				}
			});
		}

		// Collect PER_UNIT modifiers from customSpecs (these are added to unitPrice before multiplying)
		if (
			request.selectedCustomSpecs &&
			request.selectedCustomSpecs.length > 0 &&
			config.customSpecifications
		) {
			request.selectedCustomSpecs.forEach((specId) => {
				const spec = config.customSpecifications?.find((s) => s.id === specId);
				if (spec && spec.modifierType === "PER_UNIT") {
					unitPriceWithModifiers += spec.priceModifier;
					perUnitModifiers.push({
						id: spec.id,
						name: spec.name,
						modifier: spec.priceModifier,
						isOption: false,
					});
				}
			});
		}

		// Collect FIXED modifiers from options (these are added as flat fees after multiplication)
		if (request.selectedOptions && request.selectedOptions.length > 0) {
			request.selectedOptions.forEach((optId) => {
				const option = config.options.find((o) => o.id === optId);
				if (
					option &&
					(!option.modifierType || option.modifierType === "FIXED")
				) {
					fixedModifiers.push({
						id: option.id,
						name: option.name,
						modifier: option.priceModifier,
						isOption: true,
					});
				}
			});
		}

		// Collect FIXED modifiers from customSpecs (these are added as flat fees after multiplication)
		if (
			request.selectedCustomSpecs &&
			request.selectedCustomSpecs.length > 0 &&
			config.customSpecifications
		) {
			request.selectedCustomSpecs.forEach((specId) => {
				const spec = config.customSpecifications?.find((s) => s.id === specId);
				if (spec && (!spec.modifierType || spec.modifierType === "FIXED")) {
					fixedModifiers.push({
						id: spec.id,
						name: spec.name,
						modifier: spec.priceModifier,
						isOption: false,
					});
				}
			});
		}

		// Collect PERCENTAGE modifiers from options (these are calculated on basePrice and added after multiplication)
		if (request.selectedOptions && request.selectedOptions.length > 0) {
			request.selectedOptions.forEach((optId) => {
				const option = config.options.find((o) => o.id === optId);
				if (option && option.modifierType === "PERCENTAGE") {
					percentageModifiers.push({
						id: option.id,
						name: option.name,
						modifier: option.priceModifier,
						isOption: true,
					});
				}
			});
		}

		// Collect PERCENTAGE modifiers from customSpecs (these are calculated on basePrice and added after multiplication)
		if (
			request.selectedCustomSpecs &&
			request.selectedCustomSpecs.length > 0 &&
			config.customSpecifications
		) {
			request.selectedCustomSpecs.forEach((specId) => {
				const spec = config.customSpecifications?.find((s) => s.id === specId);
				if (spec && spec.modifierType === "PERCENTAGE") {
					percentageModifiers.push({
						id: spec.id,
						name: spec.name,
						modifier: spec.priceModifier,
						isOption: false,
					});
				}
			});
		}

		// 3. Calculate base price based on formula type
		// For PAGE_BASED: (unitPrice + PER_UNIT modifiers) * quantity * pageCount
		// For AREA_BASED: (W * H * (unitPrice + PER_UNIT modifiers)) / constant (if INCH) or W * H * (unitPrice + PER_UNIT modifiers) (if FEET)
		if (isPageBased) {
			basePrice = unitPriceWithModifiers * quantity * effectiveUnits;
		} else if (isAreaBased) {
			const width = request.width || 0;
			const height = request.height || 0;
			const measurementUnit = request.measurementUnit || "FEET";
			const constant = agentService.constant || 144;

			if (!width || !height || !unitPrice) {
				// If no dimensions, fall back to unit price for AREA_OR_UNIT
				if (isAreaOrUnit && unitPrice) {
					basePrice = unitPriceWithModifiers * quantity;
				} else {
					basePrice = 0;
				}
			} else {
				// Calculate area-based price
				// For INCH: (W * H * unitPrice) / 144
				// For FEET: W * H * unitPrice
				if (measurementUnit === "INCH") {
					// Formula: (W * H * sqr) / 144
					const areaPrice = (width * height * unitPriceWithModifiers) / constant;
					basePrice = areaPrice * quantity;
				} else if (measurementUnit === "FEET") {
					// Formula: W * H * sqr
					const areaPrice = width * height * unitPriceWithModifiers;
					basePrice = areaPrice * quantity;
				} else {
					basePrice = unitPriceWithModifiers * quantity;
				}
			}
		} else {
			// UNIT_BASED or other
			basePrice = unitPriceWithModifiers * quantity;
		}

		// Update breakdown baseConfiguration price
		if (breakdown.baseConfiguration) {
			if (isPageBased) {
				breakdown.baseConfiguration.price = unitPrice;
			} else if (isAreaBased) {
				const width = request.width || 0;
				const height = request.height || 0;
				const measurementUnit = request.measurementUnit || "FEET";
				const constant = agentService.constant || 144;

				if (width && height) {
					if (measurementUnit === "INCH") {
						breakdown.baseConfiguration.price = (width * height * unitPrice) / constant;
					} else {
						breakdown.baseConfiguration.price = width * height * unitPrice;
					}
				} else {
					breakdown.baseConfiguration.price = unitPrice;
				}
			} else {
				breakdown.baseConfiguration.price = unitPrice * quantity;
			}
		}

		calculatedPrice = basePrice;

		// Add PER_UNIT modifiers to breakdown (for display purposes)
		perUnitModifiers.forEach((mod) => {
			if (mod.isOption) {
				breakdown.options?.push({
					id: mod.id,
					name: mod.name,
					modifier: isPageBased ? mod.modifier : mod.modifier * quantity,
				});
			} else {
				breakdown.customSpecs?.push({
					id: mod.id,
					name: mod.name,
					modifier: isPageBased ? mod.modifier : mod.modifier * quantity,
				});
			}
		});

		// 4. Add FIXED modifiers (flat fees) - these are added after multiplication
		fixedModifiers.forEach((mod) => {
			calculatedPrice += mod.modifier;
			if (mod.isOption) {
				breakdown.options?.push({
					id: mod.id,
					name: mod.name,
					modifier: mod.modifier,
				});
			} else {
				breakdown.customSpecs?.push({
					id: mod.id,
					name: mod.name,
					modifier: mod.modifier,
				});
			}
		});

		// 5. Add PERCENTAGE modifiers (calculated on basePrice) - these are added after multiplication
		percentageModifiers.forEach((mod) => {
			const modifierAmount = basePrice * (mod.modifier / 100);
			calculatedPrice += modifierAmount;
			if (mod.isOption) {
				breakdown.options?.push({
					id: mod.id,
					name: mod.name,
					modifier: modifierAmount,
				});
			} else {
				breakdown.customSpecs?.push({
					id: mod.id,
					name: mod.name,
					modifier: modifierAmount,
				});
			}
		});

		return {
			calculatedPrice,
			basePrice,
			formulaType,
			breakdown,
			agentService: {
				id: agentService.id,
				pricePerUnit: agentService.pricePerUnit,
				pricingConfig: agentService.pricingConfig,
			},
		};
	} 
    
    // --- Legacy Pricing Calculation ---
    
    // 1. PAGE_BASED
    if (formulaType === "PAGE_BASED" || agentService.formulaType === "PAGE_BASED") {
        formulaType = "PAGE_BASED"; // Ensure set
        // Required: pricePerUnit, constant (optional)
        const pricePerPage = agentService.pricePerUnit || 0;
        const startupFee = agentService.constant || 0;
        
        // Options like "Color" might be handled via legacy `colorPriceModifier` or `options` object?
        // AgentService has `colorPriceModifier`.
        // options: { color: boolean, ... }
        
        let costPerPage = pricePerPage;
        
        // Legacy modifier: Color
        if (request.options?.color && agentService.colorPriceModifier) {
            costPerPage += agentService.colorPriceModifier;
        }

        // Legacy: Front/Back (Double sided)
        // Usually double sided might be x2 or a specific multiplier. 
        // Without specific backend logic, standard might be x2 or just handled by `filePages`.
        // If `filePages` is total pages in PDF, and we print front/back, the number of sheets changes but "pages printed" (impressions) is constant?
        // Or is price per SHEET?
        // "Page Based" usually means price per impression.
        // So `quantity` (copies) * `filePages` (pages per copy) * `costPerPage`.
        
		// Priority:
		// 1. request.filePages (passed explicitly from PDF count)
		// 2. request.options.filePages (legacy location)
		// 3. request.options.numberOfPages (legacy location)
		// 4. Fallback to 0 if we expect a file but have no count yet (cost will be just startup fee)
		const pagesPerCopy = request.filePages || request.options?.filePages || request.options?.numberOfPages || 0;
        
        // Handle double-sided (Front/Back)
        // If frontBack is true, we calculate based on SHEETS (impressions / 2)
        // assuming pricePerUnit is "Per Sheet"
        let effectiveUnits = pagesPerCopy;
        if (request.options?.frontBack) {
            effectiveUnits = Math.ceil(pagesPerCopy / 2);
        }
        
        const totalUnits = quantity * effectiveUnits;
        
        calculatedPrice = (totalUnits * costPerPage) + startupFee;
        basePrice = calculatedPrice; 
        
        // Debug logs (optional, can be removed)
        console.log('calc:', { pagesPerCopy, effectiveUnits, totalUnits, costPerPage, startupFee, calculatedPrice });
    } 
    // 2. AREA_BASED (Square Feet) - Legacy
    else if (formulaType === "AREA_FEET" || agentService.formulaType === "AREA_FEET") {
         formulaType = "AREA_FEET";
         const pricePerSqFt = agentService.pricePerUnit || 0;
         const startupFee = agentService.constant || 0;
         
         const width = request.width || 0;
         const height = request.height || 0;
         const unit = request.measurementUnit || "FEET";
         
         // Formula: W * H * sqr (for FEET) or (W * H * sqr) / 144 (for INCH)
         const areaSqFt = calculateAreaInSqFt(width, height, unit);
         const totalArea = areaSqFt * quantity;
         
         calculatedPrice = (totalArea * pricePerSqFt) + startupFee;
         basePrice = calculatedPrice;
    }
    // 2b. AREA_INCH (Square Inches) - Legacy
    else if (formulaType === "AREA_INCH" || agentService.formulaType === "AREA_INCH") {
         formulaType = "AREA_INCH";
         const pricePerSqFt = agentService.pricePerUnit || 0;
         const startupFee = agentService.constant || 0;
         const constant = agentService.constant || 144;
         
         const width = request.width || 0;
         const height = request.height || 0;
         const unit = request.measurementUnit || "INCH";
         
         // Formula: (W * H * sqr) / 144
         // If input is in inches: (W * H * pricePerSqFt) / 144
         // If input is in feet: convert to inches first
         let areaPrice = 0;
         if (unit === "INCH") {
             areaPrice = (width * height * pricePerSqFt) / constant;
         } else {
             // Convert feet to inches
             const widthInInches = width * 12;
             const heightInInches = height * 12;
             areaPrice = (widthInInches * heightInInches * pricePerSqFt) / constant;
         }
         
         calculatedPrice = (areaPrice * quantity) + startupFee;
         basePrice = calculatedPrice;
    }
    // 2c. AREA_OR_UNIT (Area if dimensions provided, otherwise unit price) - Legacy
    else if (formulaType === "AREA_OR_UNIT" || agentService.formulaType === "AREA_OR_UNIT") {
         formulaType = "AREA_OR_UNIT";
         const pricePerSqFt = agentService.pricePerUnit || 0;
         const startupFee = agentService.constant || 0;
         const constant = agentService.constant || 144;
         
         const width = request.width || 0;
         const height = request.height || 0;
         const unit = request.measurementUnit || "FEET";
         
         // Use area if dimensions provided, otherwise use unit price
         if (width && height && pricePerSqFt) {
             // Formula: W * H * sqr (for FEET) or (W * H * sqr) / 144 (for INCH)
             let areaPrice = 0;
             if (unit === "INCH") {
                 areaPrice = (width * height * pricePerSqFt) / constant;
             } else {
                 areaPrice = width * height * pricePerSqFt;
             }
             calculatedPrice = (areaPrice * quantity) + startupFee;
         } else if (pricePerSqFt) {
             // Fall back to unit price
             calculatedPrice = (pricePerSqFt * quantity) + startupFee;
         } else {
             calculatedPrice = startupFee;
         }
         basePrice = calculatedPrice;
    }
    // 3. UNIT_BASED (Per Item)
    else {
        formulaType = "UNIT_BASED";
        const pricePerUnit = agentService.pricePerUnit || 0;
        const startupFee = agentService.constant || 0;
        
        // Legacy Color Modifier for Unit based? 
        let currentUnitPrice = pricePerUnit;
         if (request.options?.color && agentService.colorPriceModifier) {
            currentUnitPrice += agentService.colorPriceModifier;
        }
        
        calculatedPrice = (currentUnitPrice * quantity) + startupFee;
        basePrice = calculatedPrice;
    }

	return {
		calculatedPrice,
		basePrice,
		formulaType,
		agentService: {
			id: agentService.id,
			pricePerUnit: agentService.pricePerUnit || 0, // Ensure defaulting to 0
			constant: agentService.constant,
            pricingConfig: agentService.pricingConfig,
		},
	};
};

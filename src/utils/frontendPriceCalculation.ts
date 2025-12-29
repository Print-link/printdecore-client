import type {
	PriceCalculationRequest,
	PriceCalculationResponse,
	AgentService,
	MeasurementUnit,
} from "../services/orderApi";

// Helper to calculate area in square feet
const calculateAreaInSqFt = (
	width: number,
	height: number,
	unit: MeasurementUnit
): number => {
	let widthInFt = width;
	let heightInFt = height;

	if (unit === "INCH") {
		widthInFt = width / 12;
		heightInFt = height / 12;
	} else if (unit === "UNIT") {
		// Treat as 1x1 for unit based if dimensions not provided, 
        // but usually UNIT based doesn't use this helper directly in same way
		return 0; 
	}

	return widthInFt * heightInFt;
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
        
        // Check if this is a PAGE_BASED service with flexible pricing
        const isPageBased = formulaType === "PAGE_BASED" || agentService.formulaType === "PAGE_BASED";
        const pagesPerCopy = request.filePages || request.options?.filePages || request.options?.numberOfPages || 0;
        
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
                    price: 0 // Will be set after calculation
                };
			}
		}

		// 2. Calculate price modifiers (for PER_UNIT, add to unitPrice; for PERCENTAGE/FIXED, calculate separately)
		let unitPriceWithModifiers = unitPrice;
		const perUnitModifiers: Array<{ id: string; name: string; modifier: number; isOption: boolean }> = [];
		const otherModifiers: Array<{ id: string; name: string; modifier: number; isOption: boolean }> = [];

		// Options
		if (request.selectedOptions && request.selectedOptions.length > 0) {
			request.selectedOptions.forEach((optId) => {
				const option = config.options.find((o) => o.id === optId);
				if (option) {
					if (option.modifierType === "PER_UNIT") {
						// For PAGE_BASED: PER_UNIT modifiers are added to unitPrice first
						// Then (unitPrice + modifiers) * quantity * pagecount
						unitPriceWithModifiers += option.priceModifier;
						perUnitModifiers.push({
							id: option.id,
							name: option.name,
							modifier: option.priceModifier,
							isOption: true,
						});
					} else if (option.modifierType === "PERCENTAGE") {
						// PERCENTAGE is calculated on base price, then added
						otherModifiers.push({
							id: option.id,
							name: option.name,
							modifier: 0, // Will be calculated after basePrice
							isOption: true,
						});
					} else {
						// FIXED - flat fee added once
						otherModifiers.push({
							id: option.id,
							name: option.name,
							modifier: option.priceModifier,
							isOption: true,
						});
					}
				}
			});
		}

		// Custom Specifications
		if (request.selectedCustomSpecs && request.selectedCustomSpecs.length > 0 && config.customSpecifications) {
			request.selectedCustomSpecs.forEach((specId) => {
				const spec = config.customSpecifications?.find((s) => s.id === specId);
				if (spec) {
					if (spec.modifierType === "PER_UNIT") {
						// For PAGE_BASED: PER_UNIT modifiers are added to unitPrice first
						unitPriceWithModifiers += spec.priceModifier;
						perUnitModifiers.push({
							id: spec.id,
							name: spec.name,
							modifier: spec.priceModifier,
							isOption: false,
						});
					} else if (spec.modifierType === "PERCENTAGE") {
						// PERCENTAGE is calculated on base price, then added
						otherModifiers.push({
							id: spec.id,
							name: spec.name,
							modifier: 0, // Will be calculated after basePrice
							isOption: false,
						});
					} else {
						// FIXED
						otherModifiers.push({
							id: spec.id,
							name: spec.name,
							modifier: spec.priceModifier,
							isOption: false,
						});
					}
				}
			});
		}

		// 3. Calculate base price: (unitPrice + PER_UNIT modifiers) * quantity * pagecount (for PAGE_BASED)
		// Formula: (unitPrice + PER_UNIT modifiers) * quantity * pagecount
		if (isPageBased) {
			// For PAGE_BASED services, multiply by effectiveUnits (pagecount)
			// If effectiveUnits is 0, result will be 0 (no pages = no price)
			basePrice = unitPriceWithModifiers * quantity * effectiveUnits;
		} else {
			basePrice = unitPriceWithModifiers * quantity;
		}

		// Update breakdown baseConfiguration price
		// For PAGE_BASED: show per-page price in breakdown, not total
		if (breakdown.baseConfiguration) {
			if (isPageBased) {
				// Show per-page price in breakdown
				breakdown.baseConfiguration.price = unitPrice;
			} else {
				breakdown.baseConfiguration.price = unitPrice * quantity;
			}
		}

		calculatedPrice = basePrice;

		// 4. Add PER_UNIT modifiers to breakdown
		// For PAGE_BASED: show per-page modifier in breakdown, not total
		perUnitModifiers.forEach((mod) => {
			let modifierAmount = 0;
			if (isPageBased) {
				// Show per-page modifier in breakdown
				modifierAmount = mod.modifier;
			} else {
				modifierAmount = mod.modifier * quantity;
			}
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

		// 5. Calculate and add other modifiers (PERCENTAGE and FIXED)
		otherModifiers.forEach((mod) => {
			const option = config.options.find((o) => o.id === mod.id);
			const spec = config.customSpecifications?.find((s) => s.id === mod.id);
			const modifierType = option?.modifierType || spec?.modifierType;
			const priceModifier = option?.priceModifier || spec?.priceModifier || 0;

			let modifierAmount = 0;
			if (modifierType === "PERCENTAGE") {
				// PERCENTAGE is calculated on the base unit price * quantity * pagecount
				modifierAmount = basePrice * (priceModifier / 100);
			} else {
				// FIXED - for PAGE_BASED, treat as per-page modifier (multiply by quantity × pagecount)
				// For other formula types, it's a flat fee
				if (isPageBased && effectiveUnits > 0) {
					modifierAmount = priceModifier * quantity * effectiveUnits;
				} else {
					modifierAmount = priceModifier;
				}
			}

			calculatedPrice += modifierAmount;

			// For breakdown display, show per-page modifier for PAGE_BASED
			let breakdownModifier = modifierAmount;
			if (isPageBased && modifierType !== "PERCENTAGE") {
				// Show per-page modifier in breakdown
				breakdownModifier = priceModifier;
			}

			if (mod.isOption) {
				breakdown.options?.push({
					id: mod.id,
					name: mod.name,
					modifier: breakdownModifier,
				});
			} else {
				breakdown.customSpecs?.push({
					id: mod.id,
					name: mod.name,
					modifier: breakdownModifier,
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
            }
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
    // 2. AREA_BASED (Square Feet)
    else if (formulaType === "AREA_FEET" || agentService.formulaType === "AREA_FEET") {
         formulaType = "AREA_FEET";
         const pricePerSqFt = agentService.pricePerUnit || 0;
         const startupFee = agentService.constant || 0;
         
         const width = request.width || 0;
         const height = request.height || 0;
         const unit = request.measurementUnit || "FEET";
         
         const areaSqFt = calculateAreaInSqFt(width, height, unit);
         const totalArea = areaSqFt * quantity;
         
         calculatedPrice = (totalArea * pricePerSqFt) + startupFee;
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

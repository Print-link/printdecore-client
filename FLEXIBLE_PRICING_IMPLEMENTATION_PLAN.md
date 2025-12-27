# Flexible Pricing System Implementation Plan

## Overview
This document outlines the implementation plan for migrating from the legacy pricing system to the new flexible pricing system (Amazon-style) while maintaining backward compatibility.

## Current State Analysis

### Current Implementation
- **Options Format**: Boolean flags (`frontBack`, `color`, `printCut`, `frontOnly`)
- **Price Calculation**: Simple options object with boolean values
- **No Base Configurations**: Direct price per unit calculation
- **No Custom Specifications**: Only built-in options supported

### Target State
- **Base Configurations**: Select from predefined sizes (A6, A5, A4, A3, Custom)
- **Options as Arrays**: `selectedOptions` and `selectedCustomSpecs` arrays
- **Flexible Pricing Config**: Support `pricingConfig` with `baseConfigurations`, `options`, and `customSpecifications`
- **Backward Compatibility**: Support both legacy and new formats

## Implementation Steps

### Phase 1: Type Definitions & API Updates

#### 1.1 Update Type Definitions (`src/services/orderApi.ts`)
- [ ] Add `PricingConfig` interface
- [ ] Add `BaseConfiguration` interface
- [ ] Add `PricingOption` interface
- [ ] Add `CustomSpecification` interface
- [ ] Update `AgentService` to include `pricingConfig?: PricingConfig`
- [ ] Update `PriceCalculationRequest` to support both formats:
  - Legacy: `options?: { frontBack?: boolean, ... }`
  - New: `selectedBaseConfigId?: string`, `selectedOptions?: string[]`, `selectedCustomSpecs?: string[]`
- [ ] Update `PriceCalculationResponse` to include pricing breakdown

#### 1.2 Update API Service (`src/services/orderApi.ts`)
- [ ] Update `calculatePrice` function to support both request formats
- [ ] Add helper function to detect if service uses new flexible pricing
- [ ] Add helper function to convert legacy format to new format (for backward compatibility)

### Phase 2: Price Calculation Hook Updates

#### 2.1 Update `useOrderPriceCalculation` Hook (`src/hooks/useOrderPriceCalculation.ts`)
- [ ] Update `OrderFormData` interface to support:
  - `selectedBaseConfigId?: string`
  - `selectedOptions?: string[]`
  - `selectedCustomSpecs?: string[]`
  - Keep legacy `options` for backward compatibility
- [ ] Update price calculation logic to:
  - Check if service has `pricingConfig`
  - Use new format if available, fallback to legacy
  - Build request payload based on detected format
- [ ] Update memoization dependencies to include new fields

### Phase 3: UI Components Updates

#### 3.1 Create Base Configuration Selector Component
- [ ] Create `BaseConfigurationSelector.tsx`
- [ ] Display available base configurations from `pricingConfig.baseConfigurations`
- [ ] Show price for each configuration
- [ ] Handle "Custom" option (show dimensions input)
- [ ] Support radio button selection

#### 3.2 Update OrderOptions Component (`src/components/order/OrderOptions.tsx`)
- [ ] Add support for new flexible options format
- [ ] Display options from `pricingConfig.options` if available
- [ ] Show price modifiers for each option
- [ ] Support multiple option selection (checkboxes)
- [ ] Maintain backward compatibility with legacy boolean options

#### 3.3 Create Custom Specifications Component
- [ ] Create `CustomSpecificationsSelector.tsx`
- [ ] Display available custom specifications from `pricingConfig.customSpecifications`
- [ ] Show price modifiers for each specification
- [ ] Support multiple selection (checkboxes)

#### 3.4 Update OrderForm Component (`src/pages/OrderForm.tsx`)
- [ ] Update `OrderFormData` interface to include new fields
- [ ] Add state for base configuration selection
- [ ] Add state for selected options array
- [ ] Add state for selected custom specs array
- [ ] Conditionally render:
  - Base configuration selector (if `pricingConfig` exists)
  - New options selector (if `pricingConfig` exists)
  - Custom specifications selector (if `pricingConfig` exists)
  - Legacy options (if no `pricingConfig`)
- [ ] Update form submission to include new fields

#### 3.5 Update PricePreview Component (`src/components/order/PricePreview.tsx`)
- [ ] Display price breakdown for new flexible pricing
- [ ] Show base configuration price
- [ ] Show selected options with modifiers
- [ ] Show custom specifications with modifiers
- [ ] Show total calculation
- [ ] Maintain backward compatibility

### Phase 4: Cart & Checkout Updates

#### 4.1 Update Cart Context (`src/contexts/CartContext.tsx`)
- [ ] Update `CartItem` interface to include:
  - `selectedBaseConfigId?: string`
  - `selectedOptions?: string[]`
  - `selectedCustomSpecs?: string[]`
  - Keep legacy `options` for backward compatibility
- [ ] Update cart item creation to preserve new fields

#### 4.2 Update Checkout Flow (`src/pages/Checkout.tsx`)
- [ ] Ensure new fields are passed when creating order items
- [ ] Update order item creation to include new format fields

### Phase 5: Backward Compatibility

#### 5.1 Detection Logic
- [ ] Create utility function `hasFlexiblePricing(agentService)` to detect if service uses new format
- [ ] Use this function throughout components to conditionally render UI

#### 5.2 Format Conversion
- [ ] Create utility function to convert legacy format to new format (for display)
- [ ] Create utility function to convert new format to legacy format (for API if needed)

### Phase 6: Testing & Validation

#### 6.1 Test Cases
- [ ] Test with service that has `pricingConfig` (new format)
- [ ] Test with service without `pricingConfig` (legacy format)
- [ ] Test base configuration selection
- [ ] Test options selection
- [ ] Test custom specifications selection
- [ ] Test price calculation with all combinations
- [ ] Test cart persistence with new fields
- [ ] Test checkout flow with new fields

## File Structure

```
src/
├── services/
│   └── orderApi.ts (updated types and API)
├── hooks/
│   └── useOrderPriceCalculation.ts (updated hook)
├── components/
│   └── order/
│       ├── BaseConfigurationSelector.tsx (new)
│       ├── CustomSpecificationsSelector.tsx (new)
│       ├── OrderOptions.tsx (updated)
│       └── PricePreview.tsx (updated)
├── pages/
│   └── OrderForm.tsx (updated)
├── contexts/
│   └── CartContext.tsx (updated)
└── utils/
    └── pricingUtils.ts (new - helper functions)
```

## Migration Strategy

1. **Parallel Support**: Both formats work simultaneously
2. **Feature Detection**: Components detect which format to use
3. **Gradual Migration**: Services can migrate to new format one by one
4. **No Breaking Changes**: Legacy services continue to work

## API Contract

### New Request Format
```typescript
{
  selectedBaseConfigId?: string;
  selectedOptions?: string[];
  selectedCustomSpecs?: string[];
  width?: number;
  height?: number;
  measurementUnit?: "FEET" | "INCH" | "UNIT";
  quantity: number;
  filePages?: number;
  // Legacy format (still supported)
  options?: {
    frontBack?: boolean;
    color?: boolean;
    printCut?: boolean;
    frontOnly?: boolean;
  };
}
```

### Response Format
```typescript
{
  success: true;
  data: {
    calculatedPrice: number;
    basePrice: number;
    formulaType: string;
    breakdown?: {
      baseConfiguration?: { id: string; name: string; price: number };
      options?: Array<{ id: string; name: string; modifier: number }>;
      customSpecs?: Array<{ id: string; name: string; modifier: number }>;
    };
    agentService: {
      id: string;
      pricingConfig?: PricingConfig;
    };
  };
}
```

## Success Criteria

- [ ] Services with `pricingConfig` use new flexible pricing UI
- [ ] Services without `pricingConfig` continue using legacy UI
- [ ] Price calculation works for both formats
- [ ] Cart and checkout preserve all pricing data
- [ ] No breaking changes to existing functionality
- [ ] All test cases pass


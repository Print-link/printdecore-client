import type { AgentService, PricingConfig } from "../services/orderApi";

/**
 * Check if an agent service uses the new flexible pricing system
 */
export const hasFlexiblePricing = (agentService: AgentService | null): boolean => {
	return agentService?.pricingConfig !== undefined && agentService.pricingConfig !== null;
};

/**
 * Get the pricing config from an agent service
 */
export const getPricingConfig = (agentService: AgentService | null): PricingConfig | null => {
	return agentService?.pricingConfig || null;
};

/**
 * Check if a base configuration allows custom dimensions
 */
export const isCustomBaseConfig = (configId: string, pricingConfig: PricingConfig | null): boolean => {
	if (!pricingConfig || !pricingConfig.baseConfigurations || !Array.isArray(pricingConfig.baseConfigurations)) return false;
	const config = pricingConfig.baseConfigurations.find(c => c.id === configId);
	return config?.isCustom === true;
};

/**
 * Get the default base configuration (first one, or one marked as default)
 */
export const getDefaultBaseConfig = (pricingConfig: PricingConfig | null): string | null => {
	if (!pricingConfig || !pricingConfig.baseConfigurations || pricingConfig.baseConfigurations.length === 0) {
		return null;
	}
	// Return first configuration as default
	return pricingConfig.baseConfigurations[0].id;
};

/**
 * Get default selected options (options marked as default)
 */
export const getDefaultOptions = (pricingConfig: PricingConfig | null): string[] => {
	if (!pricingConfig || !pricingConfig.options) return [];
	return pricingConfig.options
		.filter(option => option.default === true)
		.map(option => option.id);
};

/**
 * Format price modifier for display
 */
export const formatPriceModifier = (
	modifier: number,
	modifierType?: "PERCENTAGE" | "FIXED" | "PER_UNIT"
): string => {
	if (modifierType === "PERCENTAGE") {
		return `+${modifier}%`;
	} else if (modifierType === "PER_UNIT") {
		return `+GHS ${modifier.toFixed(2)} per unit`;
	} else {
		// FIXED or default
		return `+GHS ${modifier.toFixed(2)}`;
	}
};


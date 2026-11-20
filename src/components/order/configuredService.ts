import type { FileInfo } from "../../services/orderApi";
import type { Choices } from "../../services/pricingApi";

/**
 * A product the customer finished setting up, for a flow that takes over
 * instead of adding to the tray (the Print Assistant).
 */
export interface ConfiguredService {
	serviceTemplateId: string;
	quantity: number;
	choices: Choices;
	size?: { widthMm: number; heightMm: number };
	pages?: number;
	additionalDetails?: string;
	attachments: FileInfo[];
	calculatedPrice: number | null;
	/** No price for this combination yet: the team quotes it */
	quoteOnRequest: boolean;
	summaryLines: string[];
}

/** Where a configurator starts: earlier answers */
export type ConfiguredStart = Partial<Omit<ConfiguredService, "calculatedPrice" | "quoteOnRequest" | "summaryLines">>;

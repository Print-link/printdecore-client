import type { FileInfo } from "../../services/orderApi";
import type { Choices, FieldAnswers } from "../../services/pricingApi";
import type { FieldDraft } from "./serviceFields";

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
	/** Answers to the service's input fields, as the server takes them */
	fields?: FieldAnswers;
	/** The same answers as typed, to pick up where the customer left off */
	fieldDrafts?: Record<string, FieldDraft>;
	additionalDetails?: string;
	attachments: FileInfo[];
	calculatedPrice: number | null;
	/** No price for this combination yet: the team quotes it */
	quoteOnRequest: boolean;
	summaryLines: string[];
}

/** Where a configurator starts: earlier answers */
export type ConfiguredStart = Partial<Omit<ConfiguredService, "calculatedPrice" | "quoteOnRequest" | "summaryLines">>;

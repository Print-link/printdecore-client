import { startAgentConversation, type ServiceQuoteStart } from "../../services/printAgentApi";

/** The Print Assistant request form keeps its progress in the browser under this key */
export const ASSISTANT_STORAGE_KEY = "printdecore_assistant_v1";

export interface AssistantShop {
	id: string;
	name: string;
}

// Printy's conversation in progress, so a reload or a trip to sign in picks it
// up again — one for the Printdecore-wide assistant, one per shop
const AGENT_KEY = "printdecore_agent_conversation";
const agentKey = (shopId?: string) => (shopId ? `${AGENT_KEY}:shop:${shopId}` : AGENT_KEY);

export const readAgentConversation = (shopId?: string) => {
	try {
		return localStorage.getItem(agentKey(shopId));
	} catch {
		return null;
	}
};

export const saveAgentConversation = (shopId: string | undefined, id: string | null) => {
	try {
		if (id) localStorage.setItem(agentKey(shopId), id);
		else localStorage.removeItem(agentKey(shopId));
	} catch {
		// Storage blocked: the chat still works for this visit
	}
};

/**
 * A service the shop prices on request: Printy opens a chat with the shop on
 * the job as the customer set it up, explains it and answers questions, and
 * the customer sends it from the card for the shop to quote.
 * Returns where to go: the shop's chat.
 */
export async function startChatQuote(service: ServiceQuoteStart, coords?: { latitude: number; longitude: number }, shopId?: string) {
	const conversation = await startAgentConversation(coords, shopId, service);
	const chatShop = conversation.branchId ?? undefined;
	saveAgentConversation(chatShop, conversation.id);
	return chatShop ? `/home/shops/${chatShop}/assistant` : "/home/print-assistant";
}

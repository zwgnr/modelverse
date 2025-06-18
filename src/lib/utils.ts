import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/**
 * session storage utils for conversation creation coordination
 */
export const conversationCreation = {
	// set a flag that a new conversation was just created and should auto-start streaming
	setNewConversationCreated: (conversationId: string, streamId: string) => {
		sessionStorage.setItem('new-conversation-created', JSON.stringify({
			conversationId,
			streamId,
			timestamp: Date.now()
		}));
	},

	// check if we just created a new conversation and should start streaming
	checkAndClearNewConversationCreated: (conversationId: string) => {
		try {
			const stored = sessionStorage.getItem('new-conversation-created');
			if (!stored) return null;

			const data = JSON.parse(stored);
			
			// Check if this is for the current conversation and not too old (5 seconds max)
			if (data.conversationId === conversationId && 
					Date.now() - data.timestamp < 5000) {
				// Clear the flag and return the stream info
				sessionStorage.removeItem('new-conversation-created');
				return {
					streamId: data.streamId,
					shouldAutoStart: true
				};
			}

			// Clean up stale entries
			if (Date.now() - data.timestamp > 5000) {
				sessionStorage.removeItem('new-conversation-created');
			}
			
			return null;
		} catch {
			// Clear corrupted data
			sessionStorage.removeItem('new-conversation-created');
			return null;
		}
	},

	// Clear any pending conversation creation state (useful on page unload)
	clearNewConversationState: () => {
		sessionStorage.removeItem('new-conversation-created');
	}
};

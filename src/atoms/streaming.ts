import { atom } from "jotai";

// Core streaming state
export const drivenIdsAtom = atom<Set<string>>(new Set<string>());
export const isStreamingAtom = atom<boolean>(false);
export const currentStreamingMessageIdAtom = atom<string | null>(null);

// Actions
export const startStreamingAtom = atom(null, (get, set, messageId: string) => {
  set(drivenIdsAtom, (prev: Set<string>) => new Set(prev).add(messageId));
  set(currentStreamingMessageIdAtom, messageId);
  set(isStreamingAtom, true);
});

export const stopStreamingAtom = atom(
  null,
  (get, set, cancelMutation?: (args: any) => Promise<any>) => {
    const currentMessageId = get(currentStreamingMessageIdAtom);

    if (currentMessageId) {
      // Call the cancel mutation if provided
      if (cancelMutation) {
        cancelMutation({ messageId: currentMessageId }).catch(console.error);
      }

      set(drivenIdsAtom, (prev: Set<string>) => {
        const newSet = new Set(prev);
        newSet.delete(currentMessageId);
        return newSet;
      });
    }

    set(currentStreamingMessageIdAtom, null);
    set(isStreamingAtom, false);
  },
);

// Derived atoms
export const isMessageStreamingAtom = (messageId: string) =>
  atom((get) => get(drivenIdsAtom).has(messageId));

// Auto-detection atom for recent messages
export const autoDetectStreamingAtom = atom(
  null,
  (get, set, messages: any[] | undefined) => {
    if (!messages || messages.length === 0) return;

    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage &&
      Date.now() - lastMessage._creationTime < 10000 &&
      lastMessage.responseStreamId &&
      !lastMessage.response &&
      !get(isStreamingAtom)
    ) {
      set(startStreamingAtom, lastMessage._id);
    }
  },
);

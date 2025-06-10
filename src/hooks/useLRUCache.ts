import { useRef } from "react";

export function useLRUCache<T>(limit: number) {
  // doubly-linked list for O(1) promotion and eviction
  const nodes = useRef<
    Map<string, { key: string; value: T; prev?: string; next?: string }>
  >(new Map());
  const head = useRef<string | undefined>(undefined); // MRU
  const tail = useRef<string | undefined>(undefined); // LRU

  const removeNode = (key: string) => {
    const node = nodes.current.get(key);
    if (!node) return;

    if (node.prev) {
      nodes.current.get(node.prev)!.next = node.next;
    }
    if (node.next) {
      nodes.current.get(node.next)!.prev = node.prev;
    }
    if (tail.current === key) {
      tail.current = node.prev;
    }
  };

  const insertAtHead = (key: string) => {
    const node = nodes.current.get(key)!;
    node.prev = undefined;
    node.next = head.current;

    if (head.current) {
      nodes.current.get(head.current)!.prev = key;
    }
    head.current = key;
  };

  const evictLRU = () => {
    if (!tail.current) return;

    const evictKey = tail.current;
    tail.current = nodes.current.get(evictKey)!.prev;

    if (tail.current) {
      nodes.current.get(tail.current)!.next = undefined;
    }
    nodes.current.delete(evictKey);
  };

  const touch = (key: string) => {
    const node = nodes.current.get(key);
    if (!node || head.current === key) return;

    removeNode(key);
    insertAtHead(key);
  };

  const get = (key: string) => {
    if (!nodes.current.has(key)) return undefined;

    touch(key);
    return nodes.current.get(key)!.value;
  };

  const set = (key: string, value: T) => {
    // Update existing key
    if (nodes.current.has(key)) {
      nodes.current.get(key)!.value = value;
      touch(key);
      return;
    }

    // Add new key
    nodes.current.set(key, { key, value });

    // Handle first item
    if (!head.current) {
      head.current = tail.current = key;
    } else {
      insertAtHead(key);
    }

    // Evict if over limit
    if (nodes.current.size > limit) {
      evictLRU();
    }
  };

  const keys = () => Array.from(nodes.current.keys());

  return { get, set, keys };
}

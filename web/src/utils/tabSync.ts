// Cross-tab state sync via BroadcastChannel. One tab's persist write is
// broadcast to every other open tab, which hydrates its stores from the
// payload. Prevents the "last write wins" race when the user edits the same
// data in two tabs.

import type { PersistedState } from "../types";

const CHANNEL_NAME = "wit-sync";
let channel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

interface SyncMessage {
  type: "state";
  payload: PersistedState;
}

export function broadcastTabSync(payload: PersistedState): void {
  const c = getChannel();
  if (!c) return;
  try {
    c.postMessage({ type: "state", payload } satisfies SyncMessage);
  } catch {
    // payload is not structured-cloneable; skip — next save will retry
  }
}

export function onTabSync(handler: (payload: PersistedState) => void): () => void {
  const c = getChannel();
  if (!c) return () => {};
  const listener = (ev: MessageEvent<SyncMessage>) => {
    if (ev?.data?.type === "state" && ev.data.payload) handler(ev.data.payload);
  };
  c.addEventListener("message", listener);
  return () => c.removeEventListener("message", listener);
}

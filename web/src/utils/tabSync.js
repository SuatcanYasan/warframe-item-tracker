// Cross-tab state sync via BroadcastChannel. One tab's persist write is
// broadcast to every other open tab, which hydrates its stores from the
// payload. Prevents the "last write wins" race when the user edits the same
// data in two tabs.

const CHANNEL_NAME = "wit-sync";
let channel = null;

function getChannel() {
  if (typeof window === "undefined") return null;
  if (typeof BroadcastChannel === "undefined") return null;
  if (!channel) channel = new BroadcastChannel(CHANNEL_NAME);
  return channel;
}

export function broadcastTabSync(payload) {
  const c = getChannel();
  if (!c) return;
  try {
    c.postMessage({ type: "state", payload });
  } catch {
    // payload is not structured-cloneable; skip — next save will retry
  }
}

export function onTabSync(handler) {
  const c = getChannel();
  if (!c) return () => {};
  const listener = (ev) => {
    if (ev?.data?.type === "state" && ev.data.payload) handler(ev.data.payload);
  };
  c.addEventListener("message", listener);
  return () => c.removeEventListener("message", listener);
}

// Compact share-state encoder/decoder using browser-native DEFLATE.
// Fallback to plain base64 if CompressionStream isn't available.
//
// Format: "v1." + base64url(deflate(JSON.stringify(payload)))

const MAGIC = "v1.";

function toBase64Url(bytes) {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(str) {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function streamToBytes(stream) {
  const reader = stream.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    total += value.length;
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

export async function encodeShareState(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);

  if (typeof CompressionStream !== "undefined") {
    const stream = new Response(bytes).body.pipeThrough(new CompressionStream("deflate-raw"));
    const compressed = await streamToBytes(stream);
    return MAGIC + toBase64Url(compressed);
  }
  // Fallback — plain base64
  return "p0." + toBase64Url(bytes);
}

export async function decodeShareState(encoded) {
  if (!encoded || typeof encoded !== "string") throw new Error("empty");
  if (encoded.startsWith(MAGIC)) {
    const bytes = fromBase64Url(encoded.slice(MAGIC.length));
    if (typeof DecompressionStream !== "undefined") {
      const stream = new Response(bytes).body.pipeThrough(new DecompressionStream("deflate-raw"));
      const raw = await streamToBytes(stream);
      return JSON.parse(new TextDecoder().decode(raw));
    }
    throw new Error("browser does not support DecompressionStream");
  }
  if (encoded.startsWith("p0.")) {
    const bytes = fromBase64Url(encoded.slice(3));
    return JSON.parse(new TextDecoder().decode(bytes));
  }
  throw new Error("unknown share format");
}

// Keys of the persisted state that are safe/useful to share.
// Deliberately excludes: language, theme, customThemeTokens, themeProfiles,
// onboardingDone, storedVersion (user-local preferences, not tracker data).
export const SHAREABLE_KEYS = [
  "selectedItems",
  "completedMap",
  "completionView",
  "relicFoundComponents",
  "inventoryParts",
  "masteredItems",
  "trackedSets",
  "masteryParts",
  "completedMaterials",
  "checklistItems",
];

export function buildSharePayload(persistedState) {
  const out = {};
  for (const k of SHAREABLE_KEYS) {
    if (persistedState[k] !== undefined) out[k] = persistedState[k];
  }
  return out;
}

export function countSharePayload(payload) {
  return {
    selectedItems: payload.selectedItems?.length || 0,
    inventoryParts: Object.keys(payload.inventoryParts || {}).length,
    masteredItems: Object.keys(payload.masteredItems || {}).length,
    trackedSets: payload.trackedSets?.length || 0,
    checklistItems: payload.checklistItems?.length || 0,
    relicFoundComponents: Object.keys(payload.relicFoundComponents || {}).length,
  };
}

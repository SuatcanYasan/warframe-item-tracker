export const FALLBACK_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%2311182a'/><path d='M24 10l10 6v12l-10 6-10-6V16z' fill='%233f568f'/></svg>";

// <img onError={handleImgError} /> — tries `data-img-fallback` first (e.g.
// WFCD CDN when wiki 404s), then drops to FALLBACK_ICON. onerror is cleared
// on the final step to prevent loops.
export function handleImgError(event) {
  const img = event?.currentTarget || event?.target;
  if (!img) return;
  const fallbackUrl = img.dataset?.imgFallback;
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }
  img.onerror = null;
  img.src = FALLBACK_ICON;
}

// <img onError={hideImgOnError} /> — hide the image entirely when the
// upstream URL 404s (used for optional wiki icons that may not exist).
export function hideImgOnError(event) {
  const img = event?.currentTarget || event?.target;
  if (!img) return;
  img.onerror = null;
  img.style.display = "none";
}

// Build a warframe.market item slug from a display name.
// Examples:
//   "Ash Prime Set"         -> "ash_prime_set"
//   "Ash Prime Neuroptics"  -> "ash_prime_neuroptics"
//   "Baro Ki'Teer"          -> "baro_kiteer"
export function makeMarketSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function marketUrl(name) {
  const slug = makeMarketSlug(name);
  return slug ? `https://warframe.market/items/${slug}` : "https://warframe.market/";
}

export async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json();
}

export function makeRequirementKey(parentUniqueName, requirementUniqueName) {
  return `${parentUniqueName}::${requirementUniqueName}`;
}

export function enrichRequirements(requirements, completedByRequirement, viewMode) {
  const enriched = (requirements || []).map((requirement) => {
    const completedQuantity = Math.min(
      requirement.quantity,
      Math.max(0, Number(completedByRequirement?.[requirement.uniqueName]) || 0),
    );
    const remainingQuantity = Math.max(0, requirement.quantity - completedQuantity);
    return {
      ...requirement,
      completedQuantity,
      remainingQuantity,
      isDone: remainingQuantity === 0,
      completionPercent:
        requirement.quantity > 0
          ? Math.round((completedQuantity / requirement.quantity) * 100)
          : 100,
    };
  });

  const sorted = enriched.sort((a, b) => {
    if (a.isDone !== b.isDone) {
      return a.isDone ? 1 : -1;
    }
    return a.name.localeCompare(b.name);
  });

  return sorted.filter((entry) => {
    if (viewMode === "open") return !entry.isDone;
    if (viewMode === "done") return entry.isDone;
    return true;
  });
}

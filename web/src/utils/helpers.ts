// First file migrated to TypeScript. Pure utilities — easiest start
// (no React, no stores, no DOM ambiguity beyond image elements).
//
// Migration plan: utils → stores → hooks → components, in that order.

import type { SyntheticEvent } from "react";

export const FALLBACK_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%2311182a'/><path d='M24 10l10 6v12l-10 6-10-6V16z' fill='%233f568f'/></svg>";

type ImgEventLike = Pick<SyntheticEvent<HTMLImageElement>, "currentTarget" | "target"> | { currentTarget?: HTMLImageElement; target?: HTMLImageElement } | undefined | null;

// <img onError={handleImgError} /> — fallback chain:
//   1. `data-img-fallback` (per-image override — wiki when WFCD CDN 404s)
//   2. raw.githubusercontent.com (when jsDelivr 403/blocks the file)
//   3. FALLBACK_ICON (final placeholder; clears onerror to prevent loops)
export function handleImgError(event: ImgEventLike): void {
  const img = (event?.currentTarget || event?.target) as HTMLImageElement | undefined;
  if (!img) return;

  const fallbackUrl = img.dataset?.imgFallback;
  if (fallbackUrl && img.src !== fallbackUrl) {
    img.src = fallbackUrl;
    return;
  }

  // jsDelivr WFCD path → swap to raw GitHub. Same file, different CDN —
  // works around 403/Cloudflare rate limits and stale jsDelivr caches.
  if (img.src.includes("cdn.jsdelivr.net/gh/WFCD/warframe-items")) {
    img.src = img.src.replace(
      "cdn.jsdelivr.net/gh/WFCD/warframe-items@master",
      "raw.githubusercontent.com/WFCD/warframe-items/master",
    );
    return;
  }

  img.onerror = null;
  img.src = FALLBACK_ICON;
}

// <img onError={hideImgOnError} /> — hide the image entirely when the
// upstream URL 404s (used for optional wiki icons that may not exist).
export function hideImgOnError(event: ImgEventLike): void {
  const img = (event?.currentTarget || event?.target) as HTMLImageElement | undefined;
  if (!img) return;
  img.onerror = null;
  img.style.display = "none";
}

// Build a warframe.market item slug from a display name.
// Examples:
//   "Ash Prime Set"         -> "ash_prime_set"
//   "Ash Prime Neuroptics"  -> "ash_prime_neuroptics"
//   "Baro Ki'Teer"          -> "baro_kiteer"
export function makeMarketSlug(name: string | null | undefined): string {
  return String(name || "")
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function marketUrl(name: string | null | undefined): string {
  const slug = makeMarketSlug(name);
  return slug ? `https://warframe.market/items/${slug}` : "https://warframe.market/";
}

export async function requestJson<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export function makeRequirementKey(parentUniqueName: string, requirementUniqueName: string): string {
  return `${parentUniqueName}::${requirementUniqueName}`;
}

export interface Requirement {
  uniqueName: string;
  name: string;
  quantity: number;
}

export interface EnrichedRequirement extends Requirement {
  completedQuantity: number;
  remainingQuantity: number;
  isDone: boolean;
  completionPercent: number;
}

export type ViewMode = "all" | "open" | "done";

export function enrichRequirements(
  requirements: Requirement[] | null | undefined,
  completedByRequirement: Record<string, number> | null | undefined,
  viewMode: ViewMode,
): EnrichedRequirement[] {
  const enriched: EnrichedRequirement[] = (requirements || []).map((requirement) => {
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

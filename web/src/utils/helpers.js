export const FALLBACK_ICON =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'><rect width='48' height='48' rx='8' fill='%2311182a'/><path d='M24 10l10 6v12l-10 6-10-6V16z' fill='%233f568f'/></svg>";

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

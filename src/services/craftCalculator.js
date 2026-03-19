function addToTotals(totalsMap, key, requirement) {
  const existing = totalsMap.get(key);
  if (existing) {
    existing.quantity += requirement.quantity;
    return;
  }

  totalsMap.set(key, { ...requirement });
}

function sortedRequirements(requirementsMap) {
  return Array.from(requirementsMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}

function isResourceLikeItem(item) {
  if (!item) {
    return false;
  }

  const type = String(item.type || "").toLowerCase();
  return type === "resource" || String(item.uniqueName || "").includes("/MiscItems/");
}

function isBlueprintLikeRequirement(requirement) {
  const name = String(requirement?.name || "").toLowerCase();
  const uniqueName = String(requirement?.uniqueName || "").toLowerCase();

  return name.includes("blueprint") || uniqueName.includes("/recipes/");
}

function isGenericBlueprintLabel(name) {
  return String(name || "").trim().toLowerCase() === "blueprint";
}

function normalizeComparableText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/blueprint/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getUniqueNameLeaf(uniqueName) {
  return String(uniqueName || "")
    .split("/")
    .filter(Boolean)
    .at(-1) || "";
}

function humanizePascalCase(input) {
  return String(input || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1 $2")
    .trim();
}

function deriveNameFromBlueprintUniqueName(uniqueName) {
  const leaf = getUniqueNameLeaf(uniqueName);
  if (!leaf) {
    return null;
  }

  const withoutBlueprint = leaf.replace(/blueprint$/i, "");
  const normalized = humanizePascalCase(withoutBlueprint).trim();
  return normalized || null;
}

function getOwnBlueprintUniqueNames(item) {
  const ownBlueprints = new Set();
  const components = Array.isArray(item?.components) ? item.components : [];

  for (const component of components) {
    if (!isBlueprintLikeRequirement(component)) {
      continue;
    }

    if (isGenericBlueprintLabel(component.name)) {
      ownBlueprints.add(component.uniqueName);
      continue;
    }

    const componentBase = normalizeComparableText(component.name);
    const itemBase = normalizeComparableText(item?.name);
    if (componentBase && itemBase && componentBase.includes(itemBase)) {
      ownBlueprints.add(component.uniqueName);
    }
  }

  return ownBlueprints;
}

function createBlueprintProductLookup(itemMap) {
  const lookup = new Map();

  for (const item of itemMap.values()) {
    const ownBlueprints = getOwnBlueprintUniqueNames(item);
    for (const blueprintUniqueName of ownBlueprints) {
      if (!lookup.has(blueprintUniqueName)) {
        lookup.set(blueprintUniqueName, {
          name: item.name,
          imageName: item.imageName || null,
          imageUrl: item.imageUrl || null,
        });
      }
    }
  }

  return lookup;
}

function isOwnBlueprintRequirement(requirement, ownBlueprintUniqueNames) {
  if (!isBlueprintLikeRequirement(requirement)) {
    return false;
  }

  return ownBlueprintUniqueNames?.has(requirement.uniqueName) ?? false;
}

function keepRequirement(requirement, options, ownBlueprintUniqueNames) {
  const includeBlueprints = options?.includeBlueprints ?? false;
  if (
    !includeBlueprints &&
    isBlueprintLikeRequirement(requirement) &&
    isOwnBlueprintRequirement(requirement, ownBlueprintUniqueNames)
  ) {
    return false;
  }

  return true;
}

function formatRequirementForOutput(requirement, blueprintProductLookup) {
  if (!isBlueprintLikeRequirement(requirement)) {
    return requirement;
  }

  const matchedProduct = blueprintProductLookup.get(requirement.uniqueName);
  if (matchedProduct) {
    return {
      ...requirement,
      name: matchedProduct.name,
      imageName: requirement.imageName || matchedProduct.imageName,
      imageUrl: requirement.imageUrl || matchedProduct.imageUrl,
    };
  }

  const derivedName = deriveNameFromBlueprintUniqueName(requirement.uniqueName);
  if (!derivedName) {
    return requirement;
  }

  return {
    ...requirement,
    name: derivedName,
  };
}

function createResolver(itemMap, options) {
  const expandSubcomponents = options?.expandSubcomponents ?? true;

  function resolveRequirementsForItem(item, quantity, path = new Set()) {
    const requirements = new Map();

    for (const component of item.components) {
      const componentQuantity = (component.itemCount ?? 1) * quantity;
      const key = component.uniqueName || component.name;
      const childItem = component.uniqueName
        ? itemMap.get(component.uniqueName)
        : null;

      const childBuildQuantity = Math.max(1, Number(childItem?.buildQuantity) || 1);
      const requiredChildCrafts = Math.ceil(componentQuantity / childBuildQuantity);

      const canExpand =
        expandSubcomponents &&
        childItem &&
        Array.isArray(childItem.components) &&
        childItem.components.length > 0 &&
        !isResourceLikeItem(childItem) &&
        !path.has(childItem.uniqueName);

      if (canExpand) {
        const nextPath = new Set(path);
        nextPath.add(item.uniqueName);

        const nestedRequirements = resolveRequirementsForItem(
          childItem,
          requiredChildCrafts,
          nextPath,
        );

        for (const nestedRequirement of nestedRequirements) {
          addToTotals(requirements, nestedRequirement.uniqueName, nestedRequirement);
        }
      } else {
        const componentImage = childItem
          ? {
              imageName: childItem.imageName || null,
              imageUrl: childItem.imageUrl || null,
            }
          : {
              imageName: null,
              imageUrl: null,
            };

        addToTotals(requirements, key, {
          uniqueName: key,
          name: component.name,
          quantity: componentQuantity,
          imageName: componentImage.imageName,
          imageUrl: componentImage.imageUrl,
        });
      }
    }

    return sortedRequirements(requirements);
  }

  return {
    resolveRequirementsForItem,
  };
}

function calculateCraftRequirements(requestItems, itemMap, options = {}) {
  const resolver = createResolver(itemMap, options);
  const blueprintProductLookup = createBlueprintProductLookup(itemMap);
  const totals = new Map();
  const perItem = [];

  for (const selected of requestItems) {
    const quantity = Math.max(1, Number(selected.quantity) || 1);
    const item = itemMap.get(selected.uniqueName);

    if (!item) {
      continue;
    }

    const ownBlueprintUniqueNames = getOwnBlueprintUniqueNames(item);

    const requirements = resolver
      .resolveRequirementsForItem(item, quantity)
      .filter((requirement) => keepRequirement(requirement, options, ownBlueprintUniqueNames))
      .map((requirement) => formatRequirementForOutput(requirement, blueprintProductLookup));

    for (const requirement of requirements) {
      addToTotals(totals, requirement.uniqueName, requirement);
    }

    perItem.push({
      uniqueName: item.uniqueName,
      name: item.name,
      imageName: item.imageName || null,
      imageUrl: item.imageUrl || null,
      quantity,
      requirements,
    });
  }

  return {
    perItem,
    totals: sortedRequirements(totals),
  };
}

module.exports = {
  calculateCraftRequirements,
};






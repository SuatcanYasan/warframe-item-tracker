const test = require("node:test");
const assert = require("node:assert/strict");

const { calculateCraftRequirements } = require("../src/services/craftCalculator");

function makeItem(uniqueName, name, components) {
  return {
    uniqueName,
    name,
    components,
  };
}

test("calculateCraftRequirements should aggregate totals and per-item output", () => {
  const itemMap = new Map([
    [
      "item-a",
      makeItem("item-a", "Item A", [
        { uniqueName: "res-1", name: "Ferrite", itemCount: 2 },
        { uniqueName: "res-2", name: "Rubedo", itemCount: 3 },
      ]),
    ],
    ["res-1", makeItem("res-1", "Ferrite", [])],
    ["res-2", makeItem("res-2", "Rubedo", [])],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "item-a", quantity: 2 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.equal(result.perItem.length, 1);
  assert.deepEqual(result.perItem[0].requirements, [
    { uniqueName: "res-1", name: "Ferrite", quantity: 4, imageName: null, imageUrl: null },
    { uniqueName: "res-2", name: "Rubedo", quantity: 6, imageName: null, imageUrl: null },
  ]);

  assert.deepEqual(result.totals, [
    { uniqueName: "res-1", name: "Ferrite", quantity: 4, imageName: null, imageUrl: null },
    { uniqueName: "res-2", name: "Rubedo", quantity: 6, imageName: null, imageUrl: null },
  ]);
});

test("calculateCraftRequirements should expand nested craft components", () => {
  const itemMap = new Map([
    [
      "weapon",
      makeItem("weapon", "Weapon", [
        { uniqueName: "part", name: "Part", itemCount: 2 },
      ]),
    ],
    [
      "part",
      makeItem("part", "Part", [
        { uniqueName: "res-a", name: "Alloy Plate", itemCount: 5 },
      ]),
    ],
    ["res-a", makeItem("res-a", "Alloy Plate", [])],
  ]);

  const resultExpanded = calculateCraftRequirements(
    [{ uniqueName: "weapon", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(resultExpanded.totals, [
    { uniqueName: "res-a", name: "Alloy Plate", quantity: 10, imageName: null, imageUrl: null },
  ]);

  const resultDirectOnly = calculateCraftRequirements(
    [{ uniqueName: "weapon", quantity: 1 }],
    itemMap,
    { expandSubcomponents: false },
  );

  assert.deepEqual(resultDirectOnly.totals, [
    { uniqueName: "part", name: "Part", quantity: 2, imageName: null, imageUrl: null },
  ]);
});

test("calculateCraftRequirements should not expand resource-like misc items", () => {
  const itemMap = new Map([
    [
      "akbolto",
      makeItem("akbolto", "Akbolto", [
        { uniqueName: "bolto", name: "Bolto", itemCount: 2 },
        { uniqueName: "/Lotus/Types/Items/MiscItems/OrokinCell", name: "Orokin Cell", itemCount: 1 },
      ]),
    ],
    [
      "bolto",
      makeItem("bolto", "Bolto", [
        { uniqueName: "/Lotus/Types/Items/MiscItems/OrokinCell", name: "Orokin Cell", itemCount: 2 },
      ]),
    ],
    [
      "/Lotus/Types/Items/MiscItems/OrokinCell",
      makeItem("/Lotus/Types/Items/MiscItems/OrokinCell", "Orokin Cell", [
        { uniqueName: "nano", name: "Nano Spores", itemCount: 90000 },
      ]),
    ],
    ["nano", makeItem("nano", "Nano Spores", [])],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "akbolto", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(result.totals, [
    {
      uniqueName: "/Lotus/Types/Items/MiscItems/OrokinCell",
      name: "Orokin Cell",
      quantity: 5,
      imageName: null,
      imageUrl: null,
    },
  ]);
});

test("calculateCraftRequirements should use child buildQuantity for expansion", () => {
  const itemMap = new Map([
    [
      "parent",
      makeItem("parent", "Parent", [
        { uniqueName: "sub", name: "Sub Part", itemCount: 3 },
      ]),
    ],
    [
      "sub",
      {
        ...makeItem("sub", "Sub Part", [
          { uniqueName: "res", name: "Ferrite", itemCount: 2 },
        ]),
        buildQuantity: 2,
      },
    ],
    ["res", makeItem("res", "Ferrite", [])],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "parent", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(result.totals, [
    { uniqueName: "res", name: "Ferrite", quantity: 4, imageName: null, imageUrl: null },
  ]);
});

test("calculateCraftRequirements should exclude blueprint requirements by default", () => {
  const itemMap = new Map([
    [
      "gun",
      makeItem("gun", "Gun", [
        { uniqueName: "/Lotus/Types/Recipes/Weapons/GunBlueprint", name: "Blueprint", itemCount: 1 },
        { uniqueName: "res", name: "Ferrite", itemCount: 300 },
      ]),
    ],
    [
      "/Lotus/Types/Recipes/Weapons/GunBlueprint",
      makeItem("/Lotus/Types/Recipes/Weapons/GunBlueprint", "Blueprint", []),
    ],
    ["res", makeItem("res", "Ferrite", [])],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "gun", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(result.totals, [
    { uniqueName: "res", name: "Ferrite", quantity: 300, imageName: null, imageUrl: null },
  ]);
});

test("calculateCraftRequirements should only hide the selected item's own blueprint", () => {
  const itemMap = new Map([
    [
      "akbolto",
      makeItem("akbolto", "Akbolto", [
        { uniqueName: "/Lotus/Types/Recipes/Weapons/AkboltoBlueprint", name: "Akbolto Blueprint", itemCount: 1 },
        { uniqueName: "/Lotus/Types/Recipes/Weapons/BoltoBlueprint", name: "Bolto Blueprint", itemCount: 2 },
      ]),
    ],
    [
      "/Lotus/Types/Recipes/Weapons/AkboltoBlueprint",
      makeItem("/Lotus/Types/Recipes/Weapons/AkboltoBlueprint", "Akbolto Blueprint", []),
    ],
    [
      "/Lotus/Types/Recipes/Weapons/BoltoBlueprint",
      makeItem("/Lotus/Types/Recipes/Weapons/BoltoBlueprint", "Bolto Blueprint", []),
    ],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "akbolto", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(result.totals, [
    {
      uniqueName: "/Lotus/Types/Recipes/Weapons/BoltoBlueprint",
      name: "Bolto",
      quantity: 2,
      imageName: null,
      imageUrl: null,
    },
  ]);
});

test("calculateCraftRequirements should hide generic own blueprint and keep named sub blueprints", () => {
  const itemMap = new Map([
    [
      "akbolto",
      makeItem("akbolto", "Akbolto", [
        { uniqueName: "/Lotus/Types/Recipes/Weapons/AkBoltoBlueprint", name: "Blueprint", itemCount: 1 },
        { uniqueName: "bolto", name: "Bolto", itemCount: 2 },
      ]),
    ],
    [
      "bolto",
      makeItem("bolto", "Bolto", [
        { uniqueName: "/Lotus/Types/Recipes/Weapons/BoltoBlueprint", name: "Blueprint", itemCount: 1 },
      ]),
    ],
    [
      "/Lotus/Types/Recipes/Weapons/AkBoltoBlueprint",
      makeItem("/Lotus/Types/Recipes/Weapons/AkBoltoBlueprint", "Blueprint", []),
    ],
    [
      "/Lotus/Types/Recipes/Weapons/BoltoBlueprint",
      makeItem("/Lotus/Types/Recipes/Weapons/BoltoBlueprint", "Blueprint", []),
    ],
  ]);

  const result = calculateCraftRequirements(
    [{ uniqueName: "akbolto", quantity: 1 }],
    itemMap,
    { expandSubcomponents: true },
  );

  assert.deepEqual(result.totals, [
    {
      uniqueName: "/Lotus/Types/Recipes/Weapons/BoltoBlueprint",
      name: "Bolto",
      quantity: 2,
      imageName: null,
      imageUrl: null,
    },
  ]);
});







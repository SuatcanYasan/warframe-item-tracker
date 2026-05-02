import { describe, it, expect, beforeEach } from "vitest";
import { useCraftStore } from "./craftStore";

const ITEM_A = {
  uniqueName: "/Lotus/A",
  name: "Ash Prime",
  type: "Warframe",
  category: "Warframes",
  imageUrl: "https://example.com/ash.png",
};

describe("craftStore", () => {
  beforeEach(() => {
    useCraftStore.setState({
      selectedItems: [],
      completedMap: {},
      multiSelectMode: false,
      multiSelectedIds: new Set(),
    });
  });

  it("addItem appends new item with quantity=1", () => {
    useCraftStore.getState().addItem(ITEM_A);
    expect(useCraftStore.getState().selectedItems).toHaveLength(1);
    expect(useCraftStore.getState().selectedItems[0].quantity).toBe(1);
  });

  it("addItem increments quantity if item already exists", () => {
    const { addItem } = useCraftStore.getState();
    addItem(ITEM_A);
    addItem(ITEM_A);
    addItem(ITEM_A);
    expect(useCraftStore.getState().selectedItems).toHaveLength(1);
    expect(useCraftStore.getState().selectedItems[0].quantity).toBe(3);
  });

  it("removeItem strips by uniqueName", () => {
    const { addItem, removeItem } = useCraftStore.getState();
    addItem(ITEM_A);
    removeItem(ITEM_A.uniqueName);
    expect(useCraftStore.getState().selectedItems).toHaveLength(0);
  });

  it("updateQuantity overwrites the count", () => {
    const { addItem, updateQuantity } = useCraftStore.getState();
    addItem(ITEM_A);
    updateQuantity(ITEM_A.uniqueName, 5);
    expect(useCraftStore.getState().selectedItems[0].quantity).toBe(5);
  });

  it("clearAll empties the list and resets completed map", () => {
    const { addItem, clearAll } = useCraftStore.getState();
    addItem(ITEM_A);
    useCraftStore.setState({ completedMap: { [ITEM_A.uniqueName]: { foo: 5 } } });
    clearAll();
    expect(useCraftStore.getState().selectedItems).toHaveLength(0);
    expect(useCraftStore.getState().completedMap).toEqual({});
  });
});

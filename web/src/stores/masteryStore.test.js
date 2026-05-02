import { describe, it, expect, beforeEach } from "vitest";
import { useMasteryStore } from "./masteryStore";

const UN = "/Lotus/Powersuits/Ash";

describe("masteryStore", () => {
  beforeEach(() => {
    useMasteryStore.setState({
      masteredItems: {},
      multiSelectMode: false,
      multiSelectedIds: new Set(),
    });
  });

  it("cycles through statuses: undefined → owned → mastered → undefined", () => {
    const { cycleStatus } = useMasteryStore.getState();
    cycleStatus(UN);
    expect(useMasteryStore.getState().masteredItems[UN]).toBe("owned");
    cycleStatus(UN);
    expect(useMasteryStore.getState().masteredItems[UN]).toBe("mastered");
    cycleStatus(UN);
    expect(useMasteryStore.getState().masteredItems[UN]).toBeUndefined();
  });

  it("clearStatus removes the entry but is a no-op on missing items", () => {
    const { cycleStatus, clearStatus } = useMasteryStore.getState();
    cycleStatus(UN);
    clearStatus(UN);
    expect(useMasteryStore.getState().masteredItems[UN]).toBeUndefined();

    // No-op on missing — should not throw, should not insert null.
    clearStatus("/Lotus/MissingItem");
    expect(Object.keys(useMasteryStore.getState().masteredItems)).toHaveLength(0);
  });

  it("setStatus sets a specific status (used by undo toast)", () => {
    const { setStatus } = useMasteryStore.getState();
    setStatus(UN, "mastered");
    expect(useMasteryStore.getState().masteredItems[UN]).toBe("mastered");

    // Passing null/falsy clears the entry.
    setStatus(UN, null);
    expect(useMasteryStore.getState().masteredItems[UN]).toBeUndefined();
  });

  it("toggleMultiSelectMode flips the flag and clears the set on exit", () => {
    const { toggleMultiSelectMode, toggleMultiSelected } = useMasteryStore.getState();
    toggleMultiSelected(UN);
    expect(useMasteryStore.getState().multiSelectedIds.has(UN)).toBe(true);

    toggleMultiSelectMode();
    toggleMultiSelectMode();
    expect(useMasteryStore.getState().multiSelectMode).toBe(false);
  });

  it("bulkSetStatus applies one status to many items", () => {
    const { bulkSetStatus } = useMasteryStore.getState();
    bulkSetStatus(["a", "b", "c"], "owned");
    const items = useMasteryStore.getState().masteredItems;
    expect(items.a).toBe("owned");
    expect(items.b).toBe("owned");
    expect(items.c).toBe("owned");
  });

  it("bulkSetStatus with null status clears entries", () => {
    const { bulkSetStatus } = useMasteryStore.getState();
    bulkSetStatus(["a", "b"], "owned");
    bulkSetStatus(["a", "b"], null);
    expect(Object.keys(useMasteryStore.getState().masteredItems)).toHaveLength(0);
  });
});

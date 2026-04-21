import { create } from "zustand";

// Return the UTC "period key" (YYYY-MM-DD for daily, YYYY-Www for weekly).
// Warframe resets daily at 00:00 UTC and weekly on Monday 00:00 UTC.
function getDailyPeriodKey(d = new Date()) {
  return d.toISOString().slice(0, 10);  // YYYY-MM-DD UTC
}

function getWeeklyPeriodKey(d = new Date()) {
  // ISO week — anchor to Monday
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay() || 7;      // 1..7 (Mon..Sun)
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

export const useChecklistStore = create((set) => ({
  items: [],   // [{ id, text, type: "daily" | "weekly", doneForPeriod: "YYYY-MM-DD" | "YYYY-Www" | null, isPreset: boolean }]

  addItem: ({ text, type }) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          text: String(text || "").trim(),
          type: type === "weekly" ? "weekly" : "daily",
          doneForPeriod: null,
          isPreset: false,
        },
      ],
    })),

  removeItem: (id) =>
    set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  toggleItem: (id) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.id !== id) return i;
        const currentPeriod =
          i.type === "weekly" ? getWeeklyPeriodKey() : getDailyPeriodKey();
        // If already done for this period → unmark; else → mark
        return {
          ...i,
          doneForPeriod: i.doneForPeriod === currentPeriod ? null : currentPeriod,
        };
      }),
    })),

  bulkAddPresets: (presets) =>
    set((state) => {
      const existingTexts = new Set(state.items.map((i) => i.text.toLowerCase()));
      const fresh = presets
        .filter((p) => !existingTexts.has(p.text.toLowerCase()))
        .map((p, idx) => ({
          id: Date.now().toString() + idx,
          text: p.text,
          type: p.type,
          doneForPeriod: null,
          isPreset: true,
        }));
      return { items: [...state.items, ...fresh] };
    }),

  clearAll: () => set({ items: [] }),

  hydrate: (persisted) => {
    const raw = Array.isArray(persisted.checklistItems) ? persisted.checklistItems : [];
    const cleaned = raw
      .filter((i) => i && i.id && i.text && (i.type === "daily" || i.type === "weekly"))
      .map((i) => ({
        id: i.id,
        text: String(i.text),
        type: i.type,
        doneForPeriod: i.doneForPeriod || null,
        isPreset: !!i.isPreset,
      }));
    set({ items: cleaned });
  },
}));

// Helper selector — a task is "done" if its stored period matches current period.
export function isItemDoneNow(item) {
  if (!item?.doneForPeriod) return false;
  const current =
    item.type === "weekly" ? getWeeklyPeriodKey() : getDailyPeriodKey();
  return item.doneForPeriod === current;
}

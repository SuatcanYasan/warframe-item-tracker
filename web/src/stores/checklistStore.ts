import { create } from "zustand";
import type { PersistedState, ChecklistItem } from "../types";

// Return the UTC "period key" (YYYY-MM-DD for daily, YYYY-Www for weekly).
// Warframe resets daily at 00:00 UTC and weekly on Monday 00:00 UTC.
function getDailyPeriodKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);  // YYYY-MM-DD UTC
}

function getWeeklyPeriodKey(d: Date = new Date()): string {
  const utc = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}

interface ChecklistState {
  items: ChecklistItem[];
  addItem: (input: { text: string; type: ChecklistItem["type"] }) => void;
  removeItem: (id: string) => void;
  toggleItem: (id: string) => void;
  bulkAddPresets: (presets: { text: string; type: ChecklistItem["type"] }[]) => void;
  clearAll: () => void;
  hydrate: (persisted: Pick<PersistedState, "checklistItems">) => void;
}

export const useChecklistStore = create<ChecklistState>((set) => ({
  items: [],

  addItem: ({ text, type }) =>
    set((state) => ({
      items: [
        ...state.items,
        {
          id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
          text: String(text || "").trim(),
          type: type === "weekly" ? "weekly" : "daily",
          doneForPeriod: undefined,
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
        const currentPeriod = i.type === "weekly" ? getWeeklyPeriodKey() : getDailyPeriodKey();
        return {
          ...i,
          doneForPeriod: i.doneForPeriod === currentPeriod ? undefined : currentPeriod,
        };
      }),
    })),

  bulkAddPresets: (presets) =>
    set((state) => {
      const existingTexts = new Set(state.items.map((i) => i.text.toLowerCase()));
      const fresh: ChecklistItem[] = presets
        .filter((p) => !existingTexts.has(p.text.toLowerCase()))
        .map((p, idx) => ({
          id: Date.now().toString() + idx,
          text: p.text,
          type: p.type,
          doneForPeriod: undefined,
          isPreset: true,
        }));
      return { items: [...state.items, ...fresh] };
    }),

  clearAll: () => set({ items: [] }),

  hydrate: (persisted) => {
    const raw = Array.isArray(persisted.checklistItems) ? persisted.checklistItems : [];
    const cleaned: ChecklistItem[] = raw
      .filter((i): i is ChecklistItem =>
        Boolean(i && i.id && i.text && (i.type === "daily" || i.type === "weekly")),
      )
      .map((i) => ({
        id: i.id,
        text: String(i.text),
        type: i.type,
        doneForPeriod: i.doneForPeriod || undefined,
        isPreset: !!i.isPreset,
      }));
    set({ items: cleaned });
  },
}));

export function isItemDoneNow(item: ChecklistItem | null | undefined): boolean {
  if (!item?.doneForPeriod) return false;
  const current = item.type === "weekly" ? getWeeklyPeriodKey() : getDailyPeriodKey();
  return item.doneForPeriod === current;
}

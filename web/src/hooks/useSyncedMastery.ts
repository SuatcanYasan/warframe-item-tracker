import { useCallback, useEffect, useRef, useState } from "react";
import { useMasteryStore } from "../stores/masteryStore";
import { requestJson } from "../utils/helpers";
import type { MasteryStatus, MasteryBreakdown } from "../types";

const SYNC_INTERVAL_MS = 5 * 60 * 1000;
const MIN_REFRESH_MS = 30 * 1000;

interface ProfileSummary {
  accountId: string;
  displayName: string;
  masteryRank: number;
  itemCount: number;
  realTotalMasteryXp: number;
  breakdown: MasteryBreakdown;
  xpItems: { uniqueName: string; affinity: number; rank: number; maxRank: number; masteryXp: number }[];
}

interface SyncedMasteryReturn {
  isSyncing: boolean;
  manualRefresh: () => Promise<void>;
  error: string | null;
}

// Drives the auto-refresh loop in sync mode. Only runs while the
// document is visible so we don't burn API calls (or DE rate limit)
// when the user is on a different tab. Manual refresh ignores the
// MIN_REFRESH safeguard so the user can force an immediate fetch.
export function useSyncedMastery(): SyncedMasteryReturn {
  const mode = useMasteryStore((s) => s.mode);
  const playerId = useMasteryStore((s) => s.syncPlayerId);
  const setMasteredItems = useMasteryStore((s) => s.setMasteredItems);
  const setRealProfile = useMasteryStore((s) => s.setRealProfile);

  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const performSync = useCallback(
    async (force: boolean) => {
      const state = useMasteryStore.getState();
      if (state.mode !== "sync" || !state.syncPlayerId) return;
      if (inFlightRef.current) return;
      if (!force) {
        const since = Date.now() - (state.lastImportAt ?? 0);
        if (since < MIN_REFRESH_MS) return;
      }
      inFlightRef.current = true;
      setIsSyncing(true);
      setError(null);
      try {
        const data = await requestJson<ProfileSummary>("/api/profile/import", {
          method: "POST",
          body: JSON.stringify({ playerId: state.syncPlayerId }),
        });
        const statusMap: Record<string, MasteryStatus> = {};
        for (const it of data.xpItems) {
          statusMap[it.uniqueName] = it.rank >= it.maxRank ? "mastered" : "owned";
        }
        setMasteredItems(statusMap);
        setRealProfile(data.masteryRank, data.realTotalMasteryXp, data.breakdown, Date.now());
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        setError(msg);
      } finally {
        inFlightRef.current = false;
        setIsSyncing(false);
      }
    },
    [setMasteredItems, setRealProfile],
  );

  useEffect(() => {
    if (mode !== "sync" || !playerId) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const startInterval = () => {
      if (intervalId) return;
      intervalId = setInterval(() => performSync(false), SYNC_INTERVAL_MS);
    };
    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        startInterval();
        const since = Date.now() - (useMasteryStore.getState().lastImportAt ?? 0);
        if (since >= SYNC_INTERVAL_MS) performSync(false);
      } else {
        stopInterval();
      }
    };

    if (document.visibilityState === "visible") {
      const since = Date.now() - (useMasteryStore.getState().lastImportAt ?? 0);
      if (since >= SYNC_INTERVAL_MS) performSync(false);
      startInterval();
    }
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [mode, playerId, performSync]);

  return {
    isSyncing,
    manualRefresh: () => performSync(true),
    error,
  };
}

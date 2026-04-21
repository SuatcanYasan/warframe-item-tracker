// Subscribes to store changes and fires Discord webhook events when
// milestones happen (amp set complete, craft item complete, mastery).
//
// Called once at app startup from App.jsx.

import { useAppStore } from "../stores/appStore";
import { useAmpStore } from "../stores/ampStore";
import { useMasteryStore } from "../stores/masteryStore";
import {
  sendWebhook,
  buildAmpSetCompleteMessage,
  buildCraftItemCompleteMessage,
  buildMasteryItemMessage,
  buildPrimeCompleteMessage,
} from "./discordWebhook";

// ---- Anti-spam: per-event cooldown + global throttle ----
// Prevents "toggle a requirement on/off" looping from flooding Discord.
const COOLDOWN_MS = 60 * 60 * 1000;       // 1 hour per specific milestone
const GLOBAL_THROTTLE_MS = 2000;          // at most 1 webhook every 2s
const STORAGE_KEY = "wit-webhook-fired";
const MAX_AGE_MS = 24 * 60 * 60 * 1000;   // purge entries older than 24h

let lastGlobalSend = 0;

function loadFired() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
}
function saveFired(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function shouldSend(eventKey) {
  const now = Date.now();
  // Global throttle
  if (now - lastGlobalSend < GLOBAL_THROTTLE_MS) return false;
  // Per-event cooldown
  const fired = loadFired();
  if (fired[eventKey] && now - fired[eventKey] < COOLDOWN_MS) return false;
  // Cleanup old entries
  for (const k of Object.keys(fired)) {
    if (now - fired[k] > MAX_AGE_MS) delete fired[k];
  }
  fired[eventKey] = now;
  saveFired(fired);
  lastGlobalSend = now;
  return true;
}

function isSetComplete(set) {
  return !!(set?.prism?.done && set?.scaffold?.done && set?.brace?.done);
}

// Called from RelicPage when watchedPrimes / foundComponents changes.
const prevRelicComplete = new Set();

export function notifyRelicProgress(watchedPrimes, foundComponents) {
  if (!Array.isArray(watchedPrimes) || !foundComponents) return;
  const app = useAppStore.getState();
  if (!app.discordWebhookUrl || !app.discordWebhookEvents?.relicComplete) return;

  let total = 0;
  let currentComplete = 0;
  const newlyComplete = [];

  for (const prime of watchedPrimes) {
    const found = foundComponents[prime.uniqueName] || {};
    const keys = Object.keys(found);
    if (keys.length === 0) {
      // No component list loaded yet; skip
      continue;
    }
    total += 1;
    const allDone = keys.every((k) => !!found[k]);
    if (allDone) currentComplete += 1;
    if (allDone) {
      if (!prevRelicComplete.has(prime.uniqueName)) {
        prevRelicComplete.add(prime.uniqueName);
        newlyComplete.push(prime);
      }
    } else {
      prevRelicComplete.delete(prime.uniqueName);
    }
  }

  for (const prime of newlyComplete) {
    if (shouldSend(`relic:${prime.uniqueName}`)) {
      sendWebhook(
        app.discordWebhookUrl,
        buildPrimeCompleteMessage(prime.name, app.discordWebhookUsername, {
          current: currentComplete,
          total,
        }),
      );
    }
  }
}

// Called from App.jsx whenever the derived calculation updates. Receives
// an array of { uniqueName, name, isFullyCompleted }. Fires webhook once
// per item that transitions from incomplete → complete.
const prevCraftComplete = new Set();

export function notifyCraftProgress(perItem) {
  if (!Array.isArray(perItem)) return;
  const appState = useAppStore.getState();
  const { discordWebhookUrl, discordWebhookEvents, discordWebhookUsername } = appState;
  if (!discordWebhookUrl || !discordWebhookEvents?.craftComplete) return;

  const total = perItem.length;
  const currentComplete = perItem.filter((p) => p.isFullyCompleted).length;

  for (const item of perItem) {
    if (!item?.uniqueName) continue;
    if (item.isFullyCompleted) {
      if (!prevCraftComplete.has(item.uniqueName)) {
        prevCraftComplete.add(item.uniqueName);
        if (shouldSend(`craft:${item.uniqueName}`)) {
          sendWebhook(
            discordWebhookUrl,
            buildCraftItemCompleteMessage(
              item.name,
              discordWebhookUsername,
              { current: currentComplete, total },
            ),
          );
        }
      }
    } else {
      prevCraftComplete.delete(item.uniqueName);
    }
  }
}

export function initWebhookWatcher() {
  // ---- Amp set completion ----
  let prevSets = useAmpStore.getState().trackedSets;
  useAmpStore.subscribe((state) => {
    const next = state.trackedSets;
    for (const set of next) {
      const prev = prevSets.find((s) => s.id === set.id);
      if (!prev) continue;
      if (!isSetComplete(prev) && isSetComplete(set)) {
        const appState = useAppStore.getState();
        if (
          appState.discordWebhookUrl
          && appState.discordWebhookEvents?.ampSetComplete
          && shouldSend(`amp:${set.id}`)
        ) {
          const total = next.length;
          const current = next.filter(isSetComplete).length;
          sendWebhook(
            appState.discordWebhookUrl,
            buildAmpSetCompleteMessage(set, appState.discordWebhookUsername, { current, total }),
          );
        }
      }
    }
    prevSets = next;
  });

  // ---- Mastery: item newly marked as mastered ----
  let prevMastered = useMasteryStore.getState().masteredItems;
  useMasteryStore.subscribe((state) => {
    const next = state.masteredItems;
    for (const [uniqueName, status] of Object.entries(next)) {
      if (status === "mastered" && prevMastered[uniqueName] !== "mastered") {
        const appState = useAppStore.getState();
        if (
          appState.discordWebhookUrl
          && appState.discordWebhookEvents?.masteryComplete
          && shouldSend(`mastery:${uniqueName}`)
        ) {
          // name not available in store; use uniqueName tail as fallback
          const label = uniqueName.split("/").pop() || uniqueName;
          const current = Object.values(next).filter((v) => v === "mastered").length;
          sendWebhook(
            appState.discordWebhookUrl,
            buildMasteryItemMessage(label, appState.discordWebhookUsername, { current }),
          );
        }
      }
    }
    prevMastered = next;
  });

  // Craft completion requires the full requirement tree from /api/calculate,
  // which only exists at render time. See notifyCraftProgress() above — it's
  // called from App.jsx whenever the calculation updates.
}

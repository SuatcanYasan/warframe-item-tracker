// Discord webhook — fire-and-forget POST to user-supplied webhook URL.
// No API key, no server proxy; the URL itself authenticates.
import i18n from "../i18n";

export async function sendWebhook(url, payload) {
  if (!url) return { ok: false, reason: "no-url" };
  if (!/^https:\/\/(discord\.com|discordapp\.com|ptb\.discord\.com|canary\.discord\.com)\/api\/webhooks\//.test(url)) {
    return { ok: false, reason: "invalid-url" };
  }
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) return { ok: false, reason: `http-${response.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) };
  }
}

// ----- Message builders (Discord embed format) -----
// Localized via the active i18n language so embeds match the user's UI.

const GOLD = 0xCA8A04;
const t = (key, params) => i18n.t(key, params);

function baseFooter(username) {
  return { text: username ? `${username} · WIT` : "WIT — Warframe Item Tracker" };
}

export function buildTestMessage(username) {
  return {
    embeds: [{
      title: t("webhookTestTitle"),
      description: t("webhookTestDesc"),
      color: GOLD,
      footer: baseFooter(username),
      timestamp: new Date().toISOString(),
    }],
  };
}

function tennoName(username) {
  return username || "Tenno";
}

// set: { code, prism: {name}, scaffold: {name}, brace: {name} }
// progress: { current, total }
export function buildAmpSetCompleteMessage(set, username, progress) {
  const prismName = set?.prism?.name || "?";
  const scaffoldName = set?.scaffold?.name || "?";
  const braceName = set?.brace?.name || "?";
  const parts = `${prismName} · ${scaffoldName} · ${braceName}`;
  const who = tennoName(username);
  return {
    embeds: [{
      author: { name: `${who} · WIT` },
      title: t("webhookAmpTitle"),
      description: t("webhookAmpDesc", { name: who, code: set?.code || "?", parts }),
      color: GOLD,
      fields: progress ? [{
        name: t("webhookProgressLabel"),
        value: t("webhookProgressAmpValue", { current: progress.current, total: progress.total }),
        inline: false,
      }] : [],
      footer: baseFooter(username),
      timestamp: new Date().toISOString(),
    }],
  };
}

export function buildCraftItemCompleteMessage(itemName, username, progress) {
  const who = tennoName(username);
  return {
    embeds: [{
      author: { name: `${who} · WIT` },
      title: t("webhookCraftTitle"),
      description: t("webhookCraftDesc", { name: who, item: itemName }),
      color: GOLD,
      fields: progress ? [{
        name: t("webhookProgressLabel"),
        value: t("webhookProgressCraftValue", { current: progress.current, total: progress.total }),
        inline: false,
      }] : [],
      footer: baseFooter(username),
      timestamp: new Date().toISOString(),
    }],
  };
}

export function buildPrimeCompleteMessage(primeName, username, progress) {
  const who = tennoName(username);
  return {
    embeds: [{
      author: { name: `${who} · WIT` },
      title: t("webhookPrimeTitle"),
      description: t("webhookPrimeDesc", { name: who, prime: primeName }),
      color: GOLD,
      fields: progress ? [{
        name: t("webhookProgressLabel"),
        value: t("webhookProgressPrimeValue", { current: progress.current, total: progress.total }),
        inline: false,
      }] : [],
      footer: baseFooter(username),
      timestamp: new Date().toISOString(),
    }],
  };
}

export function buildMasteryItemMessage(itemName, username, progress) {
  const who = tennoName(username);
  return {
    embeds: [{
      author: { name: `${who} · WIT` },
      title: t("webhookMasteryTitle"),
      description: t("webhookMasteryDesc", { name: who, item: itemName }),
      color: GOLD,
      fields: progress?.current ? [{
        name: t("webhookProgressLabel"),
        value: t("webhookProgressMasteryValue", { current: progress.current }),
        inline: false,
      }] : [],
      footer: baseFooter(username),
      timestamp: new Date().toISOString(),
    }],
  };
}

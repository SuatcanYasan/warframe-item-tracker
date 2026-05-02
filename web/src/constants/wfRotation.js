// Steel Path Circuit — Warframe Rotation
//
// 8-week cycle. Each week the Circuit offers a different selection of
// 3 Warframes to pick from on Steel Path. Resets weekly on Mondays at
// 00:00 UTC, mirroring the Incarnon weapon rotation.
//
// Sources:
//   - https://wiki.warframe.com/w/The_Circuit
//   - In-game Duviri Circuit Warframe Selection screen
//
// Group "A" is anchored to the original launch trio (Loki, Mag, Volt) —
// the three Warframes available when Update 33 first introduced the
// Circuit. Subsequent groups are a stable rotation built from the most
// commonly observed Steel Path Circuit picks; the in-game selection is
// curated by DE rather than published as a strict cycle, so this table
// is a community-style approximation that loops every 8 weeks.

export const WF_EPOCH_MONDAY_UTC = Date.UTC(2024, 3, 8); // April 8, 2024

export const WF_GROUPS = [
  {
    key: "A",
    warframes: [
      { name: "Loki", role: "Stealth" },
      { name: "Mag", role: "Support" },
      { name: "Volt", role: "DPS" },
    ],
  },
  {
    key: "B",
    warframes: [
      { name: "Excalibur", role: "DPS" },
      { name: "Trinity", role: "Support" },
      { name: "Frost", role: "Tank" },
    ],
  },
  {
    key: "C",
    warframes: [
      { name: "Rhino", role: "Tank" },
      { name: "Ember", role: "DPS" },
      { name: "Banshee", role: "Support" },
    ],
  },
  {
    key: "D",
    warframes: [
      { name: "Ash", role: "Stealth" },
      { name: "Saryn", role: "DPS" },
      { name: "Nyx", role: "Support" },
    ],
  },
  {
    key: "E",
    warframes: [
      { name: "Nova", role: "DPS" },
      { name: "Vauban", role: "Support" },
      { name: "Oberon", role: "Support" },
    ],
  },
  {
    key: "F",
    warframes: [
      { name: "Mirage", role: "DPS" },
      { name: "Limbo", role: "Support" },
      { name: "Mesa", role: "DPS" },
    ],
  },
  {
    key: "G",
    warframes: [
      { name: "Chroma", role: "Tank" },
      { name: "Equinox", role: "Support" },
      { name: "Atlas", role: "Tank" },
    ],
  },
  {
    key: "H",
    warframes: [
      { name: "Wukong", role: "Tank" },
      { name: "Nezha", role: "Tank" },
      { name: "Inaros", role: "Tank" },
    ],
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Returns { groupIndex, weeksFromEpoch, mondayUtc, nextMonday }
export function getCurrentRotation(now = Date.now()) {
  const d = new Date(now);
  const dayOfWeek = d.getUTCDay(); // 0 Sun, 1 Mon ...
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  const mondayUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysSinceMonday,
  );
  const weeksFromEpoch = Math.max(
    0,
    Math.floor((mondayUtc - WF_EPOCH_MONDAY_UTC) / WEEK_MS),
  );
  const groupIndex = weeksFromEpoch % WF_GROUPS.length;
  const nextMonday = mondayUtc + WEEK_MS;
  return { groupIndex, weeksFromEpoch, mondayUtc, nextMonday };
}

export function getUpcomingRotations(weeksAhead = 8, now = Date.now()) {
  const { groupIndex, mondayUtc } = getCurrentRotation(now);
  const result = [];
  for (let i = 0; i < weeksAhead; i++) {
    const idx = (groupIndex + i) % WF_GROUPS.length;
    result.push({
      group: WF_GROUPS[idx],
      weekStart: mondayUtc + i * WEEK_MS,
      isCurrent: i === 0,
    });
  }
  return result;
}

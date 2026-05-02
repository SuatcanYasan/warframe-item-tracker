// Incarnon Genesis Rotation (Duviri Steel Path Circuit)
//
// 8-week cycle. Reset is the weekly Circuit rotation, which
// historically locks in on Mondays at 00:00 UTC. Each week unlocks
// 5 weapon adapters from a specific group.
//
// Sources:
//   - https://warframe.fandom.com/wiki/Incarnon_Genesis
//   - In-game Duviri Circuit reward screen
//
// The cycle's epoch (week 1 reference) is the first Circuit week
// after Update 33 launched. Using a known anchor where rotation = "A":
//   Reference: 2024-04-08 (Monday) → Week A
// From this Monday, we count weeks elapsed to determine current group.

export const INCARNON_EPOCH_MONDAY_UTC = Date.UTC(2024, 3, 8); // April 8, 2024

export const INCARNON_GROUPS = [
  {
    key: "A",
    weapons: [
      { name: "Braton", category: "Primary" },
      { name: "Lato", category: "Secondary" },
      { name: "Skana", category: "Melee" },
      { name: "Paris", category: "Primary" },
      { name: "Kunai", category: "Secondary" },
    ],
  },
  {
    key: "B",
    weapons: [
      { name: "Bo", category: "Melee" },
      { name: "Latron", category: "Primary" },
      { name: "Furax", category: "Melee" },
      { name: "Furis", category: "Secondary" },
      { name: "Strun", category: "Primary" },
    ],
  },
  {
    key: "C",
    weapons: [
      { name: "Lex", category: "Secondary" },
      { name: "Magistar", category: "Melee" },
      { name: "Boar", category: "Primary" },
      { name: "Gammacor", category: "Secondary" },
      { name: "Angstrum", category: "Secondary" },
    ],
  },
  {
    key: "D",
    weapons: [
      { name: "Gorgon", category: "Primary" },
      { name: "Anku", category: "Melee" },
      { name: "Burston", category: "Primary" },
      { name: "Stinger", category: "Secondary" },
      { name: "Zylok", category: "Secondary" },
    ],
  },
  {
    key: "E",
    weapons: [
      { name: "Sibear", category: "Melee" },
      { name: "Dread", category: "Primary" },
      { name: "Despair", category: "Secondary" },
      { name: "Hate", category: "Melee" },
      { name: "Dera", category: "Primary" },
    ],
  },
  {
    key: "F",
    weapons: [
      { name: "Sybaris", category: "Primary" },
      { name: "Cestra", category: "Secondary" },
      { name: "Sicarus", category: "Secondary" },
      { name: "Okina", category: "Melee" },
      { name: "Karak", category: "Primary" },
    ],
  },
  {
    key: "G",
    weapons: [
      { name: "Akbronco", category: "Secondary" },
      { name: "Mire", category: "Melee" },
      { name: "Ack & Brunt", category: "Melee" },
      { name: "Soma", category: "Primary" },
      { name: "Vasto", category: "Secondary" },
    ],
  },
  {
    key: "H",
    weapons: [
      { name: "Nami Solo", category: "Melee" },
      { name: "Pyrana", category: "Secondary" },
      { name: "Atomos", category: "Secondary" },
      { name: "Daikyu", category: "Primary" },
      { name: "Phage", category: "Primary" },
    ],
  },
];

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// Returns { groupIndex, weeksFromEpoch, mondayOfWeek, nextMonday }
export function getCurrentRotation(now = Date.now()) {
  // Snap "now" to most recent UTC Monday 00:00.
  const d = new Date(now);
  const dayOfWeek = d.getUTCDay(); // 0 Sun, 1 Mon ...
  const daysSinceMonday = (dayOfWeek + 6) % 7; // Mon=0, Tue=1, ... Sun=6
  const mondayUtc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() - daysSinceMonday,
  );
  const weeksFromEpoch = Math.max(
    0,
    Math.floor((mondayUtc - INCARNON_EPOCH_MONDAY_UTC) / WEEK_MS),
  );
  const groupIndex = weeksFromEpoch % INCARNON_GROUPS.length;
  const nextMonday = mondayUtc + WEEK_MS;
  return { groupIndex, weeksFromEpoch, mondayUtc, nextMonday };
}

export function getUpcomingRotations(weeksAhead = 8, now = Date.now()) {
  const { groupIndex, mondayUtc } = getCurrentRotation(now);
  const result = [];
  for (let i = 0; i < weeksAhead; i++) {
    const idx = (groupIndex + i) % INCARNON_GROUPS.length;
    result.push({
      group: INCARNON_GROUPS[idx],
      weekStart: mondayUtc + i * WEEK_MS,
      isCurrent: i === 0,
    });
  }
  return result;
}

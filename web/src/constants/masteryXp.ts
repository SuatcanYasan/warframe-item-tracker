// Warframe Mastery Rank — XP tables, item categories, and helpers.
//
// Sources (verified 2026-05):
//   https://wiki.warframe.com/w/Mastery_Rank
//   https://wiki.warframe.com/w/Affinity
//
// Cumulative MR XP formula:
//   MR 0..30:   2,500 × n²
//   LR 1..5:    2,250,000 + 147,500 × LR#
//
// Per-item MR XP gain at max rank:
//   Weapons (rank 30):                    100/rank → 3,000
//   Kuva/Tenet/Coda/Paracesis (rank 40):  100/rank → 4,000
//   Warframes / Sentinels / Companions /
//   Archwings (rank 30):                  200/rank → 6,000
//   Necramechs base (rank 30):            200/rank → 6,000
//   Necramechs 5 Forma (rank 40):         200/rank → 8,000
//   K-Drive (rank 30):                    100/rank → 3,000
//
// Affinity-to-rank scaling:
//   Frame/Sentinel:   1,000 × rank²  (rank 30 = 900,000 affinity)
//   Weapon:             500 × rank²  (rank 30 = 450,000 affinity)
//
// Other MR XP sources (not from xpInfo):
//   Junction win:        1,000 each (~14 junctions = ~14,000)
//   Intrinsics rank:     1,500 each (Drifter+Railjack ~9 trees × 10 = ~135,000)
//   Star chart node:     ~63 average per node (~12,000 across map)

// ============================================================================
// Cumulative MR XP table
// ============================================================================

export const MAX_REGULAR_MR = 30;
export const MAX_LEGENDARY = 5;
export const LR_STEP_XP = 147_500;
export const MR_30_XP = 2_500 * 30 * 30; // 2,250,000

// In-game rank titles. Not localized — these are official Warframe
// terms shown verbatim across regions.
const MR_RANK_TITLES: readonly string[] = [
  "Initiate", "Silver Initiate", "Gold Initiate",
  "Novice", "Silver Novice", "Gold Novice",
  "Disciple", "Silver Disciple", "Gold Disciple",
  "Seeker", "Silver Seeker", "Gold Seeker",
  "Hunter", "Silver Hunter", "Gold Hunter",
  "Eagle", "Silver Eagle", "Gold Eagle",
  "Tiger", "Silver Tiger", "Gold Tiger",
  "Dragon", "Silver Dragon", "Gold Dragon",
  "Conqueror", "Silver Conqueror", "Gold Conqueror",
  "Tigris", "Silver Tigris", "Gold Tigris",
  "True Master",
];

export function getMRRankTitle(mr: number): string {
  if (mr <= MAX_REGULAR_MR) return MR_RANK_TITLES[mr] ?? "";
  const lr = mr - MAX_REGULAR_MR;
  return `Legendary ${lr}`;
}

// Pre-computed cumulative XP for MR 0..30. After 30, use computeCumulativeXP.
export const MR_THRESHOLDS: readonly number[] = Array.from(
  { length: MAX_REGULAR_MR + 1 },
  (_, n) => 2_500 * n * n,
);

/**
 * Cumulative MR XP needed to *reach* rank `mr`. Beyond MR 30, grows by
 * LR_STEP_XP per Legendary rank.
 */
export function computeCumulativeXP(mr: number): number {
  if (mr <= 0) return 0;
  if (mr <= MAX_REGULAR_MR) return 2_500 * mr * mr;
  const legendary = Math.min(mr - MAX_REGULAR_MR, MAX_LEGENDARY);
  return MR_30_XP + LR_STEP_XP * legendary;
}

/**
 * Reverse lookup: given total XP, return the highest MR fully earned.
 * Returns 0 if `xp` is below MR 1 threshold (2,500).
 */
export function getMRForXP(xp: number): number {
  const safeXp = Math.max(0, Number(xp) || 0);
  // Regular ranks
  for (let mr = MAX_REGULAR_MR; mr >= 0; mr--) {
    if (safeXp >= computeCumulativeXP(mr)) {
      // Check legendary above
      if (mr === MAX_REGULAR_MR) {
        for (let lr = MAX_LEGENDARY; lr >= 1; lr--) {
          if (safeXp >= computeCumulativeXP(MAX_REGULAR_MR + lr)) {
            return MAX_REGULAR_MR + lr;
          }
        }
      }
      return mr;
    }
  }
  return 0;
}

export interface RankProgress {
  /** Current MR (highest rank fully earned for the given XP). */
  currentMR: number;
  /** Cumulative XP threshold AT the current rank. */
  prevThreshold: number;
  /** Cumulative XP threshold to reach the NEXT rank. */
  nextThreshold: number;
  /** XP still needed to reach the next rank. 0 when at max. */
  xpToNext: number;
  /** Progress through the current rank as 0..100. */
  progressPct: number;
  /** True when at MR 30 + LR 5 (no further ranks defined). */
  atMaxRank: boolean;
}

/**
 * Detailed progress breakdown for the rank bar.
 */
export function getRankProgress(xp: number): RankProgress {
  const safeXp = Math.max(0, Number(xp) || 0);
  const currentMR = getMRForXP(safeXp);
  const atMax = currentMR >= MAX_REGULAR_MR + MAX_LEGENDARY;
  const prevThreshold = computeCumulativeXP(currentMR);
  const nextThreshold = atMax ? prevThreshold : computeCumulativeXP(currentMR + 1);
  const xpToNext = Math.max(0, nextThreshold - safeXp);
  const span = Math.max(1, nextThreshold - prevThreshold);
  const progressPct = atMax ? 100 : Math.min(100, ((safeXp - prevThreshold) / span) * 100);
  return { currentMR, prevThreshold, nextThreshold, xpToNext, progressPct, atMaxRank: atMax };
}

// ============================================================================
// Item categories — per-rank XP, max rank, max-affinity (for status detection)
// ============================================================================

export type ItemCategory =
  | "frame"        // Warframes
  | "sentinel"     // Sentinels (200/rank, max 30)
  | "companion"    // Kavats, Kubrows, MOAs, Predasites, Vulpaphylas (200/rank)
  | "archwing"     // Archwing (200/rank)
  | "necramech"    // Necramech base (200/rank, max 30)
  | "necramech40"  // Necramech 5-Forma (200/rank, max 40 → 8000)
  | "weapon"       // Most weapons (100/rank, max 30 → 3000)
  | "weapon40"     // Kuva/Tenet/Coda/Paracesis (100/rank, max 40 → 4000)
  | "kdrive";      // K-Drive (100/rank, max 30 → 3000)

export interface CategoryInfo {
  category: ItemCategory;
  perRankXp: number;
  maxRank: number;
  /** XP a fully-ranked item contributes to MR. */
  maxXp: number;
  /** Affinity required to reach maxRank (for status detection from xpInfo). */
  affinityForMax: number;
}

const FRAME_TIER_AFFINITY = 1000; // affinity = 1000 × rank² for frame-like
const WEAPON_TIER_AFFINITY = 500; // affinity = 500 × rank² for weapons

export const CATEGORY_INFO: Record<ItemCategory, CategoryInfo> = {
  frame:       { category: "frame",       perRankXp: 200, maxRank: 30, maxXp: 6000, affinityForMax: FRAME_TIER_AFFINITY * 900 },
  sentinel:    { category: "sentinel",    perRankXp: 200, maxRank: 30, maxXp: 6000, affinityForMax: FRAME_TIER_AFFINITY * 900 },
  companion:   { category: "companion",   perRankXp: 200, maxRank: 30, maxXp: 6000, affinityForMax: FRAME_TIER_AFFINITY * 900 },
  archwing:    { category: "archwing",    perRankXp: 200, maxRank: 30, maxXp: 6000, affinityForMax: FRAME_TIER_AFFINITY * 900 },
  necramech:   { category: "necramech",   perRankXp: 200, maxRank: 30, maxXp: 6000, affinityForMax: FRAME_TIER_AFFINITY * 900 },
  necramech40: { category: "necramech40", perRankXp: 200, maxRank: 40, maxXp: 8000, affinityForMax: FRAME_TIER_AFFINITY * 1600 },
  weapon:      { category: "weapon",      perRankXp: 100, maxRank: 30, maxXp: 3000, affinityForMax: WEAPON_TIER_AFFINITY * 900 },
  weapon40:    { category: "weapon40",    perRankXp: 100, maxRank: 40, maxXp: 4000, affinityForMax: WEAPON_TIER_AFFINITY * 1600 },
  kdrive:      { category: "kdrive",      perRankXp: 100, maxRank: 30, maxXp: 3000, affinityForMax: WEAPON_TIER_AFFINITY * 900 },
};

/**
 * Detect category from a Warframe item uniqueName. Pattern-based — DE doesn't
 * tag categories explicitly in profile data. Order matters (more specific first).
 */
export function detectCategoryFromUniqueName(uniqueName: string): ItemCategory {
  const u = String(uniqueName || "");
  // Necramech first (avoid Powersuit catch)
  if (/Necramech|MechSuit/i.test(u)) return "necramech40"; // assume 5-Forma until known otherwise
  // K-Drive
  if (/Hoverboard|KDrive|Kdrive|K-Drive/i.test(u)) return "kdrive";
  // Overleveled weapons
  if (/\b(Kuva|Tenet|Paracesis|Coda)\b/i.test(u)) return "weapon40";
  // Companion / pet families
  if (/Sentinel/i.test(u)) return "sentinel";
  if (/KubrowPet|CatbrowPet|InfestedCatbrow|InfestedKubrow|MoaPets|PetPredasite|PetVulpaphyla/i.test(u)) return "companion";
  // Archwing
  if (/Archwing/i.test(u)) return "archwing";
  // Warframe
  if (/Powersuit/i.test(u)) return "frame";
  // Default: regular weapon
  return "weapon";
}

// ============================================================================
// Affinity → rank → mastery XP
// ============================================================================

/**
 * Convert lifetime affinity into the highest rank that affinity can support.
 * Returns the integer rank (0..maxRank). Affinity beyond max-rank is ignored.
 */
export function affinityToRank(affinity: number, info: CategoryInfo): number {
  const safe = Math.max(0, Number(affinity) || 0);
  if (safe >= info.affinityForMax) return info.maxRank;
  // Inverse of: affinity_for_rank_n = scaling × n²
  // → rank = floor(sqrt(affinity / scaling))
  const scaling = info.category === "weapon" || info.category === "weapon40" || info.category === "kdrive"
    ? WEAPON_TIER_AFFINITY
    : FRAME_TIER_AFFINITY;
  const rawRank = Math.sqrt(safe / scaling);
  return Math.min(info.maxRank, Math.floor(rawRank));
}

/**
 * One-shot helper: given an item's uniqueName + lifetime affinity,
 * return how much MR XP that item currently contributes.
 */
export function masteryXpForItem(uniqueName: string, affinity: number): number {
  const info = CATEGORY_INFO[detectCategoryFromUniqueName(uniqueName)];
  const rank = affinityToRank(affinity, info);
  return rank * info.perRankXp;
}

// ============================================================================
// Other MR XP sources (constants)
// ============================================================================

export const MR_XP_PER_INTRINSIC_RANK = 1_500;
export const MR_XP_PER_JUNCTION = 1_000;
export const MR_XP_PER_STAR_CHART_NODE_AVG = 63;

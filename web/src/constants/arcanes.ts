// Arcane Enhancement data — sourced from
// https://warframe.fandom.com/wiki/Arcane_Enhancement and
// https://wiki.warframe.com/w/Arcane
//
// Rank progression: an arcane levels R0 → R5 by consuming duplicate copies.
// Cumulative copies needed to REACH each rank (starting from owning 1 copy
// at R0) follow the pattern 1, +2, +4, +6, +8 — totals are:
//   R0: 1, R1: 3, R2: 7, R3: 13, R4: 21, R5: 21 (R5 == R4 cumulative).
// In practice "total copies to max-rank a single arcane" is 21.

export const ARCANE_RANK_THRESHOLDS: readonly number[] = [1, 3, 7, 13, 21];
export const ARCANE_MAX_COPIES = 21;
export const ARCANE_MAX_RANK = 5;

export type ArcaneZone = "Eidolon" | "Zariman" | "Entrati" | "Other";

export interface ArcaneZoneEntry {
  id: ArcaneZone;
  labelKey: string;
}

export const ARCANE_ZONES: readonly ArcaneZoneEntry[] = [
  { id: "Eidolon", labelKey: "arcZoneEidolon" },
  { id: "Zariman", labelKey: "arcZoneZariman" },
  { id: "Entrati", labelKey: "arcZoneEntrati" },
  { id: "Other",   labelKey: "arcZoneOther" },
];

const WIKI_IMG = "https://wiki.warframe.com/images";
const img = (file: string): string => `${WIKI_IMG}/${file}.png`;

export const ARCANE_FALLBACK_IMAGE = `${WIKI_IMG}/Arcane.png`;

export interface Arcane {
  id: string;
  name: string;
  zone: ArcaneZone;
  imageUrl: string;
}

export const ARCANES: readonly Arcane[] = [
  // ───────── Eidolon (Plains of Eidolon — Tridolon hunts) ─────────
  { id: "energize",     name: "Arcane Energize",     zone: "Eidolon", imageUrl: img("ArcaneEnergize") },
  { id: "grace",        name: "Arcane Grace",        zone: "Eidolon", imageUrl: img("ArcaneGrace") },
  { id: "guardian",     name: "Arcane Guardian",     zone: "Eidolon", imageUrl: img("ArcaneGuardian") },
  { id: "fury",         name: "Arcane Fury",         zone: "Eidolon", imageUrl: img("ArcaneFury") },
  { id: "velocity",     name: "Arcane Velocity",     zone: "Eidolon", imageUrl: img("ArcaneVelocity") },
  { id: "strike",       name: "Arcane Strike",       zone: "Eidolon", imageUrl: img("ArcaneStrike") },
  { id: "acceleration", name: "Arcane Acceleration", zone: "Eidolon", imageUrl: img("ArcaneAcceleration") },
  { id: "awakening",    name: "Arcane Awakening",    zone: "Eidolon", imageUrl: img("ArcaneAwakening") },
  { id: "healing",      name: "Arcane Healing",      zone: "Eidolon", imageUrl: img("ArcaneHealing") },
  { id: "pulse",        name: "Arcane Pulse",        zone: "Eidolon", imageUrl: img("ArcanePulse") },
  { id: "tempo",        name: "Arcane Tempo",        zone: "Eidolon", imageUrl: img("ArcaneTempo") },
  { id: "trickery",     name: "Arcane Trickery",     zone: "Eidolon", imageUrl: img("ArcaneTrickery") },
  { id: "eruption",     name: "Arcane Eruption",     zone: "Eidolon", imageUrl: img("ArcaneEruption") },
  { id: "phantasm",     name: "Arcane Phantasm",     zone: "Eidolon", imageUrl: img("ArcanePhantasm") },
  { id: "resistance",   name: "Arcane Resistance",   zone: "Eidolon", imageUrl: img("ArcaneResistance") },
  { id: "aegis",        name: "Arcane Aegis",        zone: "Eidolon", imageUrl: img("ArcaneAegis") },
  { id: "avenger",      name: "Arcane Avenger",      zone: "Eidolon", imageUrl: img("ArcaneAvenger") },
  { id: "barrier",      name: "Arcane Barrier",      zone: "Eidolon", imageUrl: img("ArcaneBarrier") },
  { id: "consequence",  name: "Arcane Consequence",  zone: "Eidolon", imageUrl: img("ArcaneConsequence") },
  { id: "deflection",   name: "Arcane Deflection",   zone: "Eidolon", imageUrl: img("ArcaneDeflection") },
  { id: "momentum",     name: "Arcane Momentum",     zone: "Eidolon", imageUrl: img("ArcaneMomentum") },
  { id: "nullifier",    name: "Arcane Nullifier",    zone: "Eidolon", imageUrl: img("ArcaneNullifier") },
  { id: "precision",    name: "Arcane Precision",    zone: "Eidolon", imageUrl: img("ArcanePrecision") },
  { id: "rage",         name: "Arcane Rage",         zone: "Eidolon", imageUrl: img("ArcaneRage") },
  { id: "ultimatum",    name: "Arcane Ultimatum",    zone: "Eidolon", imageUrl: img("ArcaneUltimatum") },
  { id: "victory",      name: "Arcane Victory",      zone: "Eidolon", imageUrl: img("ArcaneVictory") },
  { id: "warmth",       name: "Arcane Warmth",       zone: "Eidolon", imageUrl: img("ArcaneWarmth") },
  { id: "agility",      name: "Arcane Agility",      zone: "Eidolon", imageUrl: img("ArcaneAgility") },
  { id: "arachne",      name: "Arcane Arachne",      zone: "Eidolon", imageUrl: img("ArcaneArachne") },

  // ───────── Zariman (Void Cascade / Mirror Defense / Void Flood) ─────────
  { id: "blessing",     name: "Arcane Blessing",     zone: "Zariman", imageUrl: img("ArcaneBlessing") },
  { id: "steadfast",    name: "Arcane Steadfast",    zone: "Zariman", imageUrl: img("ArcaneSteadfast") },
  { id: "battery",      name: "Arcane Battery",      zone: "Zariman", imageUrl: img("ArcaneBattery") },
  { id: "ice",          name: "Arcane Ice",          zone: "Zariman", imageUrl: img("ArcaneIce") },
  { id: "bodyguard",    name: "Arcane Bodyguard",    zone: "Zariman", imageUrl: img("ArcaneBodyguard") },
  { id: "tanker",       name: "Arcane Tanker",       zone: "Zariman", imageUrl: img("ArcaneTanker") },
  { id: "reaper",       name: "Arcane Reaper",       zone: "Zariman", imageUrl: img("ArcaneReaper") },
  { id: "crusader",     name: "Arcane Crusader",     zone: "Zariman", imageUrl: ARCANE_FALLBACK_IMAGE },
  { id: "intention",    name: "Arcane Intention",    zone: "Zariman", imageUrl: img("ArcaneIntention") },

  // ───────── Entrati / Deimos (Isolation Vaults, Necramechs) ─────────
  { id: "pistoleer",         name: "Arcane Pistoleer",          zone: "Entrati", imageUrl: img("ArcanePistoleer") },
  { id: "primaryCharger",    name: "Arcane Primary Charger",    zone: "Entrati", imageUrl: img("ArcanePrimaryCharger") },
  { id: "secondaryCharger",  name: "Arcane Secondary Charger",  zone: "Entrati", imageUrl: ARCANE_FALLBACK_IMAGE },
  { id: "primaryDeadhead",   name: "Arcane Primary Deadhead",   zone: "Entrati", imageUrl: img("PrimaryDeadhead") },
  { id: "secondaryDeadhead", name: "Arcane Secondary Deadhead", zone: "Entrati", imageUrl: img("SecondaryDeadhead") },
  { id: "primaryMerciless",  name: "Arcane Primary Merciless",  zone: "Entrati", imageUrl: img("PrimaryMerciless") },
  { id: "secondaryMerciless",name: "Arcane Secondary Merciless",zone: "Entrati", imageUrl: img("SecondaryMerciless") },
  { id: "primaryFortifier",  name: "Arcane Primary Fortifier",  zone: "Entrati", imageUrl: ARCANE_FALLBACK_IMAGE },
  { id: "secondaryFortifier",name: "Arcane Secondary Fortifier",zone: "Entrati", imageUrl: img("SecondaryFortifier") },
  { id: "primaryExposure",   name: "Arcane Primary Exposure",   zone: "Entrati", imageUrl: ARCANE_FALLBACK_IMAGE },
  { id: "secondaryExposure", name: "Arcane Secondary Exposure", zone: "Entrati", imageUrl: ARCANE_FALLBACK_IMAGE },

  // ───────── Other (Operator / Hildryn Aegis Storm / popular niche) ─────────
  { id: "magus",        name: "Arcane Aegis Storm",  zone: "Other",   imageUrl: ARCANE_FALLBACK_IMAGE },
];

// ───────── Helpers ─────────

export interface RankInfo {
  currentRank: number;
  requiredForTarget: number;
  copiesNeeded: number;
}

/**
 * Given the player's current copy count for an arcane, return the rank they
 * are at and how many extra copies are required to reach `targetRank`.
 */
export function getRequiredForRank(currentCount: number, targetRank: number = ARCANE_MAX_RANK): RankInfo {
  const safeCount = Math.max(0, Math.min(Number(currentCount) || 0, ARCANE_MAX_COPIES));
  const safeTarget = Math.max(0, Math.min(Number(targetRank) || 0, ARCANE_MAX_RANK));

  let currentRank = 0;
  for (let r = 0; r < ARCANE_RANK_THRESHOLDS.length; r++) {
    if (safeCount >= ARCANE_RANK_THRESHOLDS[r]) currentRank = r;
  }
  if (safeCount >= ARCANE_MAX_COPIES) currentRank = ARCANE_MAX_RANK;

  const requiredForTarget =
    safeTarget === 0 ? ARCANE_RANK_THRESHOLDS[0] :
    safeTarget >= ARCANE_MAX_RANK ? ARCANE_MAX_COPIES :
    ARCANE_RANK_THRESHOLDS[safeTarget];

  const copiesNeeded = Math.max(0, requiredForTarget - safeCount);

  return { currentRank, requiredForTarget, copiesNeeded };
}

export function isArcaneMaxed(count: number): boolean {
  return (Number(count) || 0) >= ARCANE_MAX_COPIES;
}

export function getZoneIds(): ArcaneZone[] {
  return ARCANE_ZONES.map((z) => z.id);
}

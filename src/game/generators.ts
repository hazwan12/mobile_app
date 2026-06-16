import { GeneratorDef } from './types';

// 8-tier generator ladder. Cost and rate balanced so tier N+1 costs ~10x tier N
// and generates ~8x more, giving meaningful decisions at each tier.
export const GENERATOR_DEFS: GeneratorDef[] = [
  { id: 'lemonade', name: 'Lemonade Stand', emoji: '🍋', baseCost: 5, baseRate: 0.1, costGrowth: 1.07 },
  { id: 'newspaper', name: 'Newspaper Route', emoji: '📰', baseCost: 60, baseRate: 0.6, costGrowth: 1.07 },
  { id: 'carwash', name: 'Car Wash', emoji: '🚗', baseCost: 720, baseRate: 5.4, costGrowth: 1.07 },
  { id: 'bakery', name: 'Bakery', emoji: '🥐', baseCost: 8640, baseRate: 43, costGrowth: 1.07 },
  { id: 'diner', name: 'Diner', emoji: '🍔', baseCost: 103680, baseRate: 260, costGrowth: 1.07 },
  { id: 'bowling', name: 'Bowling Alley', emoji: '🎳', baseCost: 1_244_160, baseRate: 1_400, costGrowth: 1.07 },
  { id: 'stadium', name: 'Stadium', emoji: '🏟️', baseCost: 14_929_920, baseRate: 6_900, costGrowth: 1.07 },
  { id: 'moonbase', name: 'Moon Base', emoji: '🌙', baseCost: 179_159_040, baseRate: 32_000, costGrowth: 1.07 },
];

export function getGeneratorCost(def: GeneratorDef, currentCount: number): number {
  return def.baseCost * Math.pow(def.costGrowth, currentCount);
}

export function getBulkCost(def: GeneratorDef, currentCount: number, qty: number): number {
  // Sum of geometric series: baseCost * (growth^n) * (growth^qty - 1) / (growth - 1)
  const g = def.costGrowth;
  return def.baseCost * Math.pow(g, currentCount) * ((Math.pow(g, qty) - 1) / (g - 1));
}

export function getTotalRate(
  generators: { id: string; count: number }[],
  prestigeMultiplier: number,
  boostActive: boolean,
): number {
  let rate = 0;
  for (const owned of generators) {
    const def = GENERATOR_DEFS.find((d) => d.id === owned.id);
    if (def && owned.count > 0) {
      rate += def.baseRate * owned.count;
    }
  }
  return rate * prestigeMultiplier * (boostActive ? 2 : 1);
}

/** Prestige threshold: first prestige at 1M lifetime cash, each subsequent 10x harder */
export function getPrestigePointsGained(lifetimeCash: number): number {
  if (lifetimeCash < 1_000_000) return 0;
  return Math.floor(Math.log10(lifetimeCash / 1_000_000) * 10) + 1;
}

export function calcPrestigeMultiplier(prestigePoints: number): number {
  // Each prestige point adds 50% to the base multiplier (floor 1x)
  return 1 + prestigePoints * 0.5;
}

/** Max offline earnings window before rewarded ad extends it */
export const OFFLINE_EARNINGS_CAP_MS = 2 * 60 * 60 * 1000; // 2 hours
export const OFFLINE_EARNINGS_CAP_EXTENDED_MS = 8 * 60 * 60 * 1000; // 8 hours via rewarded ad

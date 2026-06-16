export interface GeneratorDef {
  id: string;
  name: string;
  emoji: string;
  baseCost: number;
  baseRate: number; // cash per second at count=1
  costGrowth: number; // exponential cost multiplier per purchase
}

export interface OwnedGenerator {
  id: string;
  count: number;
}

export interface ActiveBoost {
  type: 'double_earnings';
  expiresAt: number; // unix ms
}

export interface GameState {
  cash: number;
  lifetimeCash: number; // for prestige calculation
  prestigePoints: number;
  prestigeMultiplier: number; // derived from prestigePoints, stored for perf
  generators: OwnedGenerator[];
  lastTickAt: number; // unix ms, used for offline earnings
  activeBoost: ActiveBoost | null;
  lastInterstitialAt: number; // unix ms, for frequency capping
  lastSessionStartAt: number; // unix ms, for capping on resume
}

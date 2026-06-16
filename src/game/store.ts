import { create } from 'zustand';
import { GameState, OwnedGenerator } from './types';
import {
  GENERATOR_DEFS,
  getGeneratorCost,
  getTotalRate,
  getPrestigePointsGained,
  calcPrestigeMultiplier,
  OFFLINE_EARNINGS_CAP_MS,
} from './generators';
import { loadGame, saveGame } from '../storage/persistence';

const TAP_BASE_VALUE = 1; // cash per tap before multipliers
const TICK_INTERVAL_MS = 200; // passive income tick rate

function initialGenerators(): OwnedGenerator[] {
  return GENERATOR_DEFS.map((d) => ({ id: d.id, count: 0 }));
}

function makeInitialState(): GameState {
  return {
    cash: 0,
    lifetimeCash: 0,
    prestigePoints: 0,
    prestigeMultiplier: 1,
    generators: initialGenerators(),
    lastTickAt: Date.now(),
    activeBoost: null,
    lastInterstitialAt: 0,
    lastSessionStartAt: Date.now(),
  };
}

interface GameStore extends GameState {
  // actions
  tap: () => void;
  buyGenerator: (id: string, qty: number) => void;
  prestige: () => void;
  applyOfflineEarnings: (cappedMs?: number) => number; // returns cash earned
  activateBoost: (durationMs: number) => void;
  tick: () => void;
  recordInterstitialShown: () => void;
  setSessionStart: () => void;
  hydrate: () => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...makeInitialState(),

  hydrate: async () => {
    const saved = await loadGame();
    if (saved) {
      set({ ...saved, lastSessionStartAt: Date.now() });
    }
  },

  tap: () => {
    set((s) => {
      const earned = TAP_BASE_VALUE * s.prestigeMultiplier;
      const cash = s.cash + earned;
      const lifetimeCash = s.lifetimeCash + earned;
      saveGame({ ...s, cash, lifetimeCash });
      return { cash, lifetimeCash };
    });
  },

  buyGenerator: (id, qty) => {
    set((s) => {
      const def = GENERATOR_DEFS.find((d) => d.id === id);
      if (!def) return s;
      const owned = s.generators.find((g) => g.id === id)!;
      const cost =
        qty === 1
          ? getGeneratorCost(def, owned.count)
          : (() => {
              let total = 0;
              for (let i = 0; i < qty; i++) total += getGeneratorCost(def, owned.count + i);
              return total;
            })();
      if (s.cash < cost) return s;
      const generators = s.generators.map((g) =>
        g.id === id ? { ...g, count: g.count + qty } : g,
      );
      const updated = { ...s, cash: s.cash - cost, generators };
      saveGame(updated);
      return updated;
    });
  },

  prestige: () => {
    set((s) => {
      const gained = getPrestigePointsGained(s.lifetimeCash);
      if (gained === 0) return s;
      const prestigePoints = s.prestigePoints + gained;
      const prestigeMultiplier = calcPrestigeMultiplier(prestigePoints);
      const next: GameState = {
        ...makeInitialState(),
        prestigePoints,
        prestigeMultiplier,
        lastTickAt: Date.now(),
        lastInterstitialAt: s.lastInterstitialAt,
        lastSessionStartAt: s.lastSessionStartAt,
        activeBoost: null,
      };
      saveGame(next);
      return next;
    });
  },

  applyOfflineEarnings: (cappedMs) => {
    const s = get();
    const elapsed = Math.min(
      Date.now() - s.lastTickAt,
      cappedMs ?? OFFLINE_EARNINGS_CAP_MS,
    );
    const boostActive = s.activeBoost !== null && s.activeBoost.expiresAt > Date.now();
    const rate = getTotalRate(s.generators, s.prestigeMultiplier, boostActive);
    const earned = (rate * elapsed) / 1000;
    if (earned <= 0) return 0;
    set((prev) => {
      const cash = prev.cash + earned;
      const lifetimeCash = prev.lifetimeCash + earned;
      const updated = { ...prev, cash, lifetimeCash, lastTickAt: Date.now() };
      saveGame(updated);
      return updated;
    });
    return earned;
  },

  activateBoost: (durationMs) => {
    set((s) => {
      const next = {
        ...s,
        activeBoost: { type: 'double_earnings' as const, expiresAt: Date.now() + durationMs },
      };
      saveGame(next);
      return next;
    });
  },

  tick: () => {
    set((s) => {
      const now = Date.now();
      const elapsed = (now - s.lastTickAt) / 1000; // seconds
      const boostActive = s.activeBoost !== null && s.activeBoost.expiresAt > now;
      const rate = getTotalRate(s.generators, s.prestigeMultiplier, boostActive);
      const earned = rate * elapsed;
      if (earned <= 0) return { ...s, lastTickAt: now };
      const cash = s.cash + earned;
      const lifetimeCash = s.lifetimeCash + earned;
      return { ...s, cash, lifetimeCash, lastTickAt: now };
    });
  },

  recordInterstitialShown: () => {
    set({ lastInterstitialAt: Date.now() });
  },

  setSessionStart: () => {
    set({ lastSessionStartAt: Date.now() });
  },
}));

export function getCurrentRate(state: GameState): number {
  const boostActive = state.activeBoost !== null && state.activeBoost.expiresAt > Date.now();
  return getTotalRate(state.generators, state.prestigeMultiplier, boostActive);
}

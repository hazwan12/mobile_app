import AsyncStorage from '@react-native-async-storage/async-storage';
import { GameState } from '../game/types';

const SAVE_KEY = '@tycoon_save_v1';

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveGame(state: GameState): void {
  // Debounce to avoid writing on every tick (200ms intervals)
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    try {
      await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(state));
    } catch (_) {}
  }, 2000);
}

export async function loadGame(): Promise<GameState | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (_) {
    return null;
  }
}

export async function clearSave(): Promise<void> {
  await AsyncStorage.removeItem(SAVE_KEY);
}

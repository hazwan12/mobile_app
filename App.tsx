import React, { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

import { useGameStore } from './src/game/store';
import { getCurrentRate } from './src/game/store';
import { OFFLINE_EARNINGS_CAP_MS } from './src/game/generators';
import { initAds, setSessionStart, showInterstitialIfReady } from './src/ads/adManager';
import { trackAdRevenue, trackSessionStart } from './src/analytics/analytics';
import MainScreen from './src/screens/MainScreen';

const TICK_MS = 200;

export default function App() {
  const { hydrate, tick, applyOfflineEarnings, lastTickAt, generators, prestigeMultiplier, activeBoost } =
    useGameStore((s) => ({
      hydrate: s.hydrate,
      tick: s.tick,
      applyOfflineEarnings: s.applyOfflineEarnings,
      lastTickAt: s.lastTickAt,
      generators: s.generators,
      prestigeMultiplier: s.prestigeMultiplier,
      activeBoost: s.activeBoost,
    }));

  const [ready, setReady] = useState(false);
  const [offlinePending, setOfflinePending] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>('active');

  // ── Boot sequence ──
  useEffect(() => {
    (async () => {
      // 1. Load saved game
      await hydrate();

      // 2. ATT prompt (iOS only — must happen before ad init)
      await requestTrackingPermissionsAsync();

      // 3. Init AdMob
      await initAds();

      setSessionStart();
      trackSessionStart();
      setReady(true);
    })();
  }, []);

  // ── Check offline earnings once store is hydrated ──
  useEffect(() => {
    if (!ready) return;
    const elapsed = Date.now() - lastTickAt;
    if (elapsed < 5000) return; // less than 5s — not worth showing modal
    const state = useGameStore.getState();
    const rate = getCurrentRate(state);
    const cappedElapsedSec = Math.min(elapsed, OFFLINE_EARNINGS_CAP_MS) / 1000;
    const pending = rate * cappedElapsedSec;
    if (pending > 0) setOfflinePending(pending);
  }, [ready]);

  // ── Passive income tick ──
  useEffect(() => {
    if (!ready) return;
    tickRef.current = setInterval(tick, TICK_MS);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [ready, tick]);

  // ── App foreground/background transitions ──
  useEffect(() => {
    const sub = AppState.addEventListener('change', async (next: AppStateStatus) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (next === 'active' && prev !== 'active') {
        // Resumed from background
        setSessionStart();
        trackSessionStart();

        const state = useGameStore.getState();
        const elapsed = Date.now() - state.lastTickAt;
        if (elapsed > 5000) {
          const rate = getCurrentRate(state);
          const cappedElapsedSec = Math.min(elapsed, OFFLINE_EARNINGS_CAP_MS) / 1000;
          const pending = rate * cappedElapsedSec;
          if (pending > 0) {
            setOfflinePending(pending);
          }
        }

        // Capped interstitial on resume (after grace period)
        await showInterstitialIfReady('app_resume');
      }

      if (next === 'background' || next === 'inactive') {
        // Pause tick, save happens via debounce in store
        if (tickRef.current) clearInterval(tickRef.current);
        tickRef.current = null;
      } else if (next === 'active' && tickRef.current === null) {
        tickRef.current = setInterval(tick, TICK_MS);
      }
    });
    return () => sub.remove();
  }, [tick]);

  if (!ready) return null; // splash screen handles this visually

  return (
    <>
      <StatusBar style="light" />
      <MainScreen
        offlinePending={offlinePending}
        onOfflineCollected={() => setOfflinePending(0)}
      />
    </>
  );
}

import AppLovinMAX from 'react-native-applovin-max';
import { trackEvent } from '../analytics/analytics';

// ---------------------------------------------------------------------------
// Replace these with your real AppLovin SDK Key and unit IDs from the dashboard
// ---------------------------------------------------------------------------
const SDK_KEY = '__YOUR_APPLOVIN_SDK_KEY__';

export const AD_UNITS = {
  banner: {
    android: '__YOUR_ANDROID_BANNER_UNIT_ID__',
    ios: '__YOUR_IOS_BANNER_UNIT_ID__',
  },
  interstitial: {
    android: '__YOUR_ANDROID_INTERSTITIAL_UNIT_ID__',
    ios: '__YOUR_IOS_INTERSTITIAL_UNIT_ID__',
  },
  rewarded: {
    android: '__YOUR_ANDROID_REWARDED_UNIT_ID__',
    ios: '__YOUR_IOS_REWARDED_UNIT_ID__',
  },
};

import { Platform } from 'react-native';

function unitId(units: { android: string; ios: string }): string {
  return Platform.OS === 'ios' ? units.ios : units.android;
}

// ---------------------------------------------------------------------------
// Interstitial frequency cap
// ---------------------------------------------------------------------------
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes between interstitials
const SESSION_GRACE_PERIOD_MS = 60 * 1000; // never show in first 60s of a session

let _lastInterstitialAt = 0;
let _sessionStartAt = Date.now();

export function setSessionStart(): void {
  _sessionStartAt = Date.now();
}

function canShowInterstitial(): boolean {
  const now = Date.now();
  if (now - _sessionStartAt < SESSION_GRACE_PERIOD_MS) return false;
  if (now - _lastInterstitialAt < INTERSTITIAL_MIN_INTERVAL_MS) return false;
  return true;
}

// ---------------------------------------------------------------------------
// SDK init
// ---------------------------------------------------------------------------
let _initialized = false;

export async function initAds(onRevenue?: (adUnitId: string, revenue: number) => void): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  AppLovinMAX.setVerboseLogging(__DEV__);

  const conf = await AppLovinMAX.initialize(SDK_KEY);
  if (!conf) return;

  // Rewarded ad events
  AppLovinMAX.addAdLoadedEventListener('AppLovinMAX.Rewarded', () => {});
  AppLovinMAX.addAdRevenuePaidListener('AppLovinMAX.Rewarded', (info: any) => {
    onRevenue?.(info.adUnitId, info.revenue ?? 0);
    trackEvent('ad_revenue', { ad_unit: info.adUnitId, revenue: info.revenue ?? 0, format: 'rewarded' });
  });
  AppLovinMAX.addAdRevenuePaidListener('AppLovinMAX.Interstitial', (info: any) => {
    onRevenue?.(info.adUnitId, info.revenue ?? 0);
    trackEvent('ad_revenue', { ad_unit: info.adUnitId, revenue: info.revenue ?? 0, format: 'interstitial' });
  });
  AppLovinMAX.addAdRevenuePaidListener('AppLovinMAX.Banner', (info: any) => {
    onRevenue?.(info.adUnitId, info.revenue ?? 0);
    trackEvent('ad_revenue', { ad_unit: info.adUnitId, revenue: info.revenue ?? 0, format: 'banner' });
  });

  // Pre-load interstitial and rewarded
  AppLovinMAX.loadInterstitial(unitId(AD_UNITS.interstitial));
  AppLovinMAX.loadRewardedAd(unitId(AD_UNITS.rewarded));
}

// ---------------------------------------------------------------------------
// Show interstitial (respects frequency cap)
// ---------------------------------------------------------------------------
export async function showInterstitialIfReady(placement: string): Promise<boolean> {
  if (!canShowInterstitial()) return false;
  const id = unitId(AD_UNITS.interstitial);
  const ready = await AppLovinMAX.isInterstitialReady(id);
  if (!ready) {
    AppLovinMAX.loadInterstitial(id);
    return false;
  }
  return new Promise((resolve) => {
    let done = false;
    const finish = (earned: boolean) => {
      if (done) return;
      done = true;
      _lastInterstitialAt = Date.now();
      trackEvent('ad_shown', { format: 'interstitial', placement });
      AppLovinMAX.loadInterstitial(id); // reload for next time
      resolve(earned);
    };
    AppLovinMAX.addAdHiddenEventListener('AppLovinMAX.Interstitial', () => finish(true));
    AppLovinMAX.addAdLoadFailedEventListener('AppLovinMAX.Interstitial', () => finish(false));
    AppLovinMAX.showInterstitial(id, placement);
  });
}

// ---------------------------------------------------------------------------
// Show rewarded ad
// ---------------------------------------------------------------------------
export async function showRewardedAd(placement: string): Promise<boolean> {
  const id = unitId(AD_UNITS.rewarded);
  const ready = await AppLovinMAX.isRewardedAdReady(id);
  if (!ready) {
    AppLovinMAX.loadRewardedAd(id);
    return false;
  }
  return new Promise((resolve) => {
    let rewarded = false;
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      trackEvent('ad_shown', { format: 'rewarded', placement, rewarded });
      AppLovinMAX.loadRewardedAd(id);
      resolve(rewarded);
    };

    AppLovinMAX.addAdReceivedRewardEventListener('AppLovinMAX.Rewarded', () => {
      rewarded = true;
    });
    AppLovinMAX.addAdHiddenEventListener('AppLovinMAX.Rewarded', finish);
    AppLovinMAX.addAdLoadFailedEventListener('AppLovinMAX.Rewarded', () => {
      rewarded = false;
      finish();
    });
    AppLovinMAX.showRewardedAd(id, placement);
  });
}

export { unitId };

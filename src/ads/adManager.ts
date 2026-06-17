import { Platform } from 'react-native';
import MobileAds, {
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';
import { trackEvent } from '../analytics/analytics';

// ---------------------------------------------------------------------------
// Ad Unit IDs — replace with real IDs from AdMob dashboard before release.
// In dev mode we use Google's official test IDs so no real ads are served.
// ---------------------------------------------------------------------------
const IS_DEV = __DEV__;

export const AD_UNITS = {
  banner: {
    android: IS_DEV ? TestIds.ADAPTIVE_BANNER : '__YOUR_ANDROID_BANNER_UNIT_ID__',
    ios:     IS_DEV ? TestIds.ADAPTIVE_BANNER : '__YOUR_IOS_BANNER_UNIT_ID__',
  },
  interstitial: {
    android: IS_DEV ? TestIds.INTERSTITIAL : '__YOUR_ANDROID_INTERSTITIAL_UNIT_ID__',
    ios:     IS_DEV ? TestIds.INTERSTITIAL  : '__YOUR_IOS_INTERSTITIAL_UNIT_ID__',
  },
  rewarded: {
    android: IS_DEV ? TestIds.REWARDED : '__YOUR_ANDROID_REWARDED_UNIT_ID__',
    ios:     IS_DEV ? TestIds.REWARDED  : '__YOUR_IOS_REWARDED_UNIT_ID__',
  },
};

export function unitId(units: { android: string; ios: string }): string {
  return Platform.OS === 'ios' ? units.ios : units.android;
}

// ---------------------------------------------------------------------------
// Interstitial frequency cap
// ---------------------------------------------------------------------------
const INTERSTITIAL_MIN_INTERVAL_MS = 3 * 60 * 1000;
const SESSION_GRACE_PERIOD_MS = 60 * 1000;

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
// Pre-loaded ad instances — created once and reloaded after each show
// ---------------------------------------------------------------------------
let _interstitial: InterstitialAd | null = null;
let _rewarded: RewardedAd | null = null;

function createInterstitial(): InterstitialAd {
  const ad = InterstitialAd.createForAdRequest(unitId(AD_UNITS.interstitial));
  ad.load();
  return ad;
}

function createRewarded(): RewardedAd {
  const ad = RewardedAd.createForAdRequest(unitId(AD_UNITS.rewarded));
  ad.load();
  return ad;
}

// ---------------------------------------------------------------------------
// SDK init
// ---------------------------------------------------------------------------
let _initialized = false;

export async function initAds(): Promise<void> {
  if (_initialized) return;
  _initialized = true;

  await MobileAds().initialize();

  // Pre-load both fullscreen formats
  _interstitial = createInterstitial();
  _rewarded = createRewarded();
}

// ---------------------------------------------------------------------------
// Show interstitial (respects frequency cap)
// ---------------------------------------------------------------------------
export function showInterstitialIfReady(placement: string): Promise<boolean> {
  if (!canShowInterstitial()) return Promise.resolve(false);
  if (!_interstitial?.loaded) return Promise.resolve(false);

  return new Promise((resolve) => {
    const ad = _interstitial!;
    const unsub = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsub();
      _lastInterstitialAt = Date.now();
      trackEvent('ad_shown', { format: 'interstitial', placement });
      _interstitial = createInterstitial(); // reload for next time
      resolve(true);
    });
    const unsubErr = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubErr();
      resolve(false);
    });
    ad.show();
  });
}

// ---------------------------------------------------------------------------
// Show rewarded ad
// ---------------------------------------------------------------------------
export function showRewardedAd(placement: string): Promise<boolean> {
  if (!_rewarded?.loaded) return Promise.resolve(false);

  return new Promise((resolve) => {
    const ad = _rewarded!;
    let rewarded = false;

    const unsubReward = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      rewarded = true;
    });
    const unsubClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
      unsubReward();
      unsubClose();
      trackEvent('ad_shown', { format: 'rewarded', placement, rewarded });
      _rewarded = createRewarded(); // reload for next time
      resolve(rewarded);
    });
    const unsubErr = ad.addAdEventListener(AdEventType.ERROR, () => {
      unsubErr();
      resolve(false);
    });
    ad.show();
  });
}

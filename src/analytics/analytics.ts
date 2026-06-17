import { getApp } from '@react-native-firebase/app';
import { getAnalytics, logEvent, logAppOpen } from '@react-native-firebase/analytics';

const analytics = () => getAnalytics(getApp());

// Central event-tracking wrapper. All callers use this so we can swap
// providers without touching game logic.

export async function trackEvent(name: string, params?: Record<string, string | number | boolean>): Promise<void> {
  try {
    await logEvent(analytics(), name, params);
  } catch (_) {
    // Never let analytics failures surface to the user
  }
}

// ---------------------------------------------------------------------------
// Named retention + monetisation events (keeps event names consistent)
// ---------------------------------------------------------------------------

export function trackSessionStart(): void {
  trackEvent('session_start');
}

export function trackFirstOpen(): void {
  logAppOpen(analytics()).catch(() => {});
}

export function trackPrestige(pointsGained: number, newTotal: number): void {
  trackEvent('prestige', { points_gained: pointsGained, new_total: newTotal });
}

export function trackGeneratorBuy(id: string, qty: number, cost: number): void {
  trackEvent('generator_buy', { generator_id: id, qty, cost });
}

export function trackAdRevenue(adUnitId: string, revenue: number, format: string): void {
  // Also log Firebase's standard ad_impression event for LTV modelling
  logEvent(analytics(), 'ad_impression', {
    ad_unit_name: adUnitId,
    value: revenue,
    currency: 'USD',
    ad_format: format,
  }).catch(() => {});
}

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
# Type-check without emitting
npx tsc --noEmit

# EAS build — development (installs expo-dev-client on device/simulator)
eas build --profile development --platform android
eas build --profile development --platform ios

# EAS build — production
eas build --profile production --platform all

# Submit to stores
eas submit --platform ios
eas submit --platform android
```

> **Expo Go will not work** — AdMob and Firebase are native modules that require a custom dev client built via EAS.

## Architecture

### State management — `src/game/store.ts`
Single Zustand store for all game state (`GameState` in `src/game/types.ts`). The store is the only place that mutates state. Components subscribe via selectors to avoid full re-renders. `hydrate()` loads from AsyncStorage on mount; `saveGame()` in `src/storage/persistence.ts` debounces writes at 2s.

### Game loop
- **Passive income**: `tick()` is called every 200ms from `App.tsx` via `setInterval`. It computes `elapsed * rate` and adds to cash without persisting (persistence debounce handles that).
- **Offline earnings**: On app resume, `App.tsx` computes `elapsed * rate` capped at 2 hrs and surfaces an `OfflineModal`. Watching a rewarded ad extends the cap to 8 hrs.
- **Tap income**: `TAP_BASE_VALUE * prestigeMultiplier` per tap.

### Generator economics — `src/game/generators.ts`
8 tiers (lemonade stand → moon base). Cost scales as `baseCost * 1.07^count`. Rate is `baseRate * count`. Prestige resets generators/cash but accumulates points; each point adds `+0.5×` to the permanent earnings multiplier.

### Ad layer — `src/ads/adManager.ts`
Wraps `react-native-google-mobile-ads` (AdMob). Three placements:

| Format | Placement key | Trigger | Cap |
|---|---|---|---|
| Banner | — | Always visible, bottom of MainScreen | — |
| Interstitial | `app_resume`, `post_prestige` | App foreground, after prestige | 3 min gap + 60s session grace |
| Rewarded | `boost_2x` | "2× boost" button | Player-initiated only |

In `__DEV__` mode, Google test ad unit IDs are used automatically — no real ads served. Replace `__YOUR_*_UNIT_ID__` placeholders in `AD_UNITS` for production builds.

### Analytics — `src/analytics/analytics.ts`
Thin wrapper over `@react-native-firebase/analytics`. All callers use `trackEvent(name, params)`. Key events: `session_start`, `prestige`, `generator_buy`, `ad_impression`, `ad_revenue`, `offline_collect`.

### Platform config — `app.config.js`
Dynamic Expo config (replaces `app.json`). Owns:
- iOS `NSUserTrackingUsageDescription` and `SKAdNetworkItems`
- Android `AD_ID` permission
- Expo plugin order: `expo-dev-client` → `expo-tracking-transparency` → Firebase → `react-native-google-mobile-ads`

## Before your first build — checklist

- [ ] Replace `__YOUR_ANDROID_ADMOB_APP_ID__` and `__YOUR_IOS_ADMOB_APP_ID__` in `app.config.js` (from AdMob dashboard → App settings)
- [ ] Replace all `__YOUR_*_UNIT_ID__` in `src/ads/adManager.ts` (6 unit IDs — banner, interstitial, rewarded × 2 platforms)
- [x] Add `google-services.json` (Android Firebase config) to project root
- [x] Add `GoogleService-Info.plist` (iOS Firebase config) to project root
- [ ] Update `bundleIdentifier` / `package` in `app.config.js`
- [ ] Run `eas init` to populate `extra.eas.projectId`
- [ ] Add complete `SKAdNetworkItems` list from AdMob dashboard to `app.config.js`
- [ ] Add a privacy policy URL to your App Store / Play Store listings

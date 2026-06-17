---
name: project-tycoon-game
description: Active build — idle tycoon mobile game in Expo (TypeScript) with AdMob ads and Firebase Analytics
metadata:
  type: project
---

Active build: idle/incremental tycoon game for iOS + Android.

**Why:** User wants a shippable passive-income mobile game with rewarded-ad monetization.

**Stack:** React Native + Expo (SDK 56), TypeScript, Zustand for state, AsyncStorage for persistence, react-native-google-mobile-ads (AdMob) for ads, Firebase Analytics, expo-dev-client + EAS Build.

**EAS project:** @hazwan12/idle-tycoon (ID: 8068f3d5-c398-46e2-a517-d29b0e6b76c2)

**Bundle IDs:** `com.hazwan12.idletycoon` (iOS + Android)

**Firebase project:** idletycoon-81120

**Theme:** Generic resource tycoon (lemonade stand → moon base, 8 generator tiers)

**Monetization design:**
- Rewarded: "2× earnings for 30 min" boost, "extend offline earnings cap from 2hr → 8hr"
- Interstitial: capped (3 min gap, 60s session grace), shown on prestige + app resume
- Banner: bottom of MainScreen only
- AdMob test App IDs in use — replace before production build

## Current status

- ✅ Full game built and type-checking clean (`npx tsc --noEmit` passes)
- ✅ Dev client APK installed on user's phone (Samsung, Android)
- ✅ Firebase configured (google-services.json + GoogleService-Info.plist in project root)
- ✅ EAS project linked (@hazwan12/idle-tycoon)
- ✅ eas-cli installed globally
- ⏳ App not yet on Play Store
- ⏳ Real AdMob App IDs + Ad Unit IDs not yet set (using Google test IDs)

## Todo before Play Store submission

- [ ] Replace AdMob test App IDs in `app.config.js` with real ones from AdMob dashboard
- [ ] Replace `__YOUR_*_UNIT_ID__` placeholders in `src/ads/adManager.ts` (6 unit IDs)
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Run `eas build --profile production --platform android` for the AAB
- [ ] Add privacy policy URL
- [ ] Fill Play Store listing (screenshots, description, feature graphic 1024×500px, icon 512×512px)

## Key files

- `src/game/store.ts` — Zustand store, all game state mutations
- `src/game/generators.ts` — 8-tier generator defs, cost/rate math, prestige math
- `src/ads/adManager.ts` — AdMob init, interstitial (frequency capped), rewarded
- `src/analytics/analytics.ts` — Firebase Analytics wrapper
- `src/screens/MainScreen.tsx` — main UI: tap, generators list, boost button, banner ad
- `app.config.js` — all platform config, Expo plugins, AdMob App IDs

## Memory sync between machines

Memory files live in `.claude/memory/` inside the project repo and sync via git.
On a new machine after pulling, tell Claude: "read memory from .claude/memory/ in the project".

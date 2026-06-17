# Idle Tycoon

A mobile idle/incremental game built with React Native + Expo. Tap to earn cash, buy generators that produce passively, and prestige for permanent multipliers.

## Prerequisites

- Node.js v18+
- `npm install -g eas-cli`
- Expo account at [expo.dev](https://expo.dev)

## Setup

```bash
npm install
eas login
npx expo start
```

Then scan the QR code from the Expo dev client on your device.

> Expo Go will not work — AdMob and Firebase are native modules. You need the custom dev client built via EAS.

## Building

```bash
# Development APK (install on device for testing)
eas build --profile development --platform android

# Production AAB (for Play Store submission)
eas build --profile production --platform android

# iOS
eas build --profile development --platform ios
eas build --profile production --platform ios
```

## Before releasing

- [ ] Replace AdMob test App IDs in `app.config.js` with real ones from AdMob dashboard
- [ ] Replace all `__YOUR_*_UNIT_ID__` placeholders in `src/ads/adManager.ts` (6 unit IDs)
- [ ] Add a privacy policy URL to your Play Store / App Store listings

## Tech stack

| Layer | Library |
|---|---|
| Framework | Expo SDK 56 (React Native) |
| State | Zustand |
| Persistence | AsyncStorage (debounced 2s) |
| Ads | react-native-google-mobile-ads (AdMob) |
| Analytics | Firebase Analytics |
| Builds | EAS Build |

## Game mechanics

- **Tap** — earn cash manually, scales with prestige multiplier
- **Generators** — 8 tiers (lemonade stand → moon base), passive income while app is open
- **Offline earnings** — capped at 2 hrs; watch a rewarded ad to extend to 8 hrs
- **Prestige** — reset at $1M lifetime cash, earn points that permanently increase earnings multiplier (+0.5× per point)
- **2× boost** — watch a rewarded ad for 30 min of doubled earnings

## Project structure

```
src/
  game/         # Core loop — store, generators, types, number formatting
  ads/          # AdMob wrapper with frequency capping
  analytics/    # Firebase Analytics wrapper
  screens/      # MainScreen, PrestigeModal, OfflineModal
  components/   # GeneratorRow, BoostBanner
  storage/      # AsyncStorage save/load
```

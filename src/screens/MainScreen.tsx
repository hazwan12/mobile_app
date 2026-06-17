import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
} from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';

import { useGameStore, getCurrentRate } from '../game/store';
import { GENERATOR_DEFS } from '../game/generators';
import { formatCash, formatRate } from '../game/format';
import { getPrestigePointsGained } from '../game/generators';
import { showRewardedAd, showInterstitialIfReady, AD_UNITS, unitId } from '../ads/adManager';

import GeneratorRow from '../components/GeneratorRow';
import BoostBanner from '../components/BoostBanner';
import PrestigeModal from './PrestigeModal';
import OfflineModal from './OfflineModal';

interface Props {
  offlinePending: number;
  onOfflineCollected: () => void;
}

export default function MainScreen({ offlinePending, onOfflineCollected }: Props) {
  const [buyQty, setBuyQty] = useState<1 | 10>(1);
  const [prestigeOpen, setPrestigeOpen] = useState(false);

  const { cash, lifetimeCash, prestigeMultiplier, generators, activeBoost, tap } = useGameStore(
    (s) => ({
      cash: s.cash,
      lifetimeCash: s.lifetimeCash,
      prestigeMultiplier: s.prestigeMultiplier,
      generators: s.generators,
      activeBoost: s.activeBoost,
      tap: s.tap,
    }),
  );

  const rate = getCurrentRate({ cash, lifetimeCash, prestigeMultiplier, generators, activeBoost } as any);
  const prestigeAvailable = getPrestigePointsGained(lifetimeCash) > 0;
  const boostActive = activeBoost !== null && activeBoost.expiresAt > Date.now();

  const handleBoostAd = useCallback(async () => {
    const rewarded = await showRewardedAd('boost_2x');
    if (rewarded) {
      useGameStore.getState().activateBoost(30 * 60 * 1000); // 30 min
    }
  }, []);

  const handlePrestigeClose = useCallback(async () => {
    setPrestigeOpen(false);
    // Natural break point — good moment for a capped interstitial
    await showInterstitialIfReady('post_prestige');
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.cashLabel}>Cash</Text>
        <Text style={styles.cash}>{formatCash(cash)}</Text>
        <Text style={styles.rate}>{formatRate(rate)}</Text>
        <Text style={styles.multiplier}>{prestigeMultiplier.toFixed(1)}× multiplier</Text>
      </View>

      <BoostBanner />

      {/* ── Tap button ── */}
      <TouchableOpacity style={styles.tapBtn} onPress={tap} activeOpacity={0.75}>
        <Text style={styles.tapEmoji}>🏭</Text>
        <Text style={styles.tapLabel}>TAP</Text>
      </TouchableOpacity>

      {/* ── Action bar ── */}
      <View style={styles.actionBar}>
        {/* Buy qty toggle */}
        <View style={styles.qtyToggle}>
          <TouchableOpacity
            style={[styles.qtyBtn, buyQty === 1 && styles.qtyBtnActive]}
            onPress={() => setBuyQty(1)}
          >
            <Text style={[styles.qtyText, buyQty === 1 && styles.qtyTextActive]}>×1</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.qtyBtn, buyQty === 10 && styles.qtyBtnActive]}
            onPress={() => setBuyQty(10)}
          >
            <Text style={[styles.qtyText, buyQty === 10 && styles.qtyTextActive]}>×10</Text>
          </TouchableOpacity>
        </View>

        {/* 2× boost button */}
        <TouchableOpacity
          style={[styles.boostBtn, boostActive && styles.boostBtnActive]}
          onPress={handleBoostAd}
          disabled={boostActive}
        >
          <Text style={styles.boostText}>{boostActive ? '⚡ Active' : '📺 2× Boost'}</Text>
        </TouchableOpacity>

        {/* Prestige button */}
        <TouchableOpacity
          style={[styles.prestigeBtn, !prestigeAvailable && styles.prestigeBtnDim]}
          onPress={() => setPrestigeOpen(true)}
        >
          <Text style={styles.prestigeText}>🌟 Prestige</Text>
        </TouchableOpacity>
      </View>

      {/* ── Generators list ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {GENERATOR_DEFS.map((def) => {
          const owned = generators.find((g) => g.id === def.id)!;
          return (
            <GeneratorRow
              key={def.id}
              def={def}
              count={owned.count}
              qty={buyQty}
            />
          );
        })}
        {/* Bottom padding so last row isn't hidden behind the banner */}
        <View style={{ height: 70 }} />
      </ScrollView>

      {/* ── AdMob banner — bottom, outside scroll ── */}
      <View style={styles.bannerContainer}>
        <BannerAd
          unitId={unitId(AD_UNITS.banner)}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        />
      </View>

      {/* ── Modals ── */}
      <PrestigeModal visible={prestigeOpen} onClose={handlePrestigeClose} />
      <OfflineModal
        visible={offlinePending > 0}
        pendingEarnings={offlinePending}
        onCollect={onOfflineCollected}
      />
    </SafeAreaView>
  );
}

const BANNER_HEIGHT = Platform.OS === 'ios' ? 50 : 50;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#181825' },

  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 8 },
  cashLabel: { color: '#585b70', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase' },
  cash: { color: '#cdd6f4', fontSize: 36, fontWeight: '900', lineHeight: 44 },
  rate: { color: '#a6e3a1', fontSize: 14, fontWeight: '600' },
  multiplier: { color: '#cba6f7', fontSize: 12, marginTop: 2 },

  tapBtn: {
    alignSelf: 'center',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: '#313244',
    borderWidth: 3,
    borderColor: '#89b4fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
  },
  tapEmoji: { fontSize: 44 },
  tapLabel: { color: '#89b4fa', fontWeight: '800', fontSize: 13, letterSpacing: 2, marginTop: 2 },

  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 8,
  },
  qtyToggle: { flexDirection: 'row', borderRadius: 8, overflow: 'hidden', borderWidth: 1, borderColor: '#313244' },
  qtyBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#1e1e2e' },
  qtyBtnActive: { backgroundColor: '#89b4fa' },
  qtyText: { color: '#585b70', fontWeight: '700', fontSize: 13 },
  qtyTextActive: { color: '#1e1e2e' },

  boostBtn: {
    flex: 1,
    backgroundColor: '#313244',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  boostBtnActive: { backgroundColor: '#f9e2af' },
  boostText: { color: '#cdd6f4', fontWeight: '700', fontSize: 12 },

  prestigeBtn: {
    flex: 1,
    backgroundColor: '#45475a',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  prestigeBtnDim: { opacity: 0.4 },
  prestigeText: { color: '#cdd6f4', fontWeight: '700', fontSize: 12 },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4 },

  bannerContainer: {
    height: BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#11111b',
  },
  banner: { width: '100%', height: BANNER_HEIGHT },
});

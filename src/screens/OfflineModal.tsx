import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { formatCash } from '../game/format';
import { OFFLINE_EARNINGS_CAP_EXTENDED_MS } from '../game/generators';
import { showRewardedAd } from '../ads/adManager';
import { useGameStore } from '../game/store';
import { trackEvent } from '../analytics/analytics';

interface Props {
  visible: boolean;
  pendingEarnings: number; // what user would earn at 2hr cap
  onCollect: (extended: boolean) => void;
}

export default function OfflineModal({ visible, pendingEarnings, onCollect }: Props) {
  const applyOfflineEarnings = useGameStore((s) => s.applyOfflineEarnings);

  const handleCollect = () => {
    applyOfflineEarnings();
    trackEvent('offline_collect', { amount: pendingEarnings, extended: false });
    onCollect(false);
  };

  const handleWatchAd = async () => {
    const rewarded = await showRewardedAd('offline_extend');
    if (rewarded) {
      applyOfflineEarnings(OFFLINE_EARNINGS_CAP_EXTENDED_MS);
      trackEvent('offline_collect', { amount: pendingEarnings, extended: true });
    } else {
      applyOfflineEarnings();
    }
    onCollect(true);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>💤 Welcome Back!</Text>
          <Text style={styles.sub}>Your businesses kept running while you were away.</Text>

          <Text style={styles.earned}>{formatCash(pendingEarnings)}</Text>
          <Text style={styles.earneLabel}>ready to collect (2hr cap)</Text>

          <TouchableOpacity style={styles.adBtn} onPress={handleWatchAd}>
            <Text style={styles.adBtnText}>📺  Watch Ad — Collect up to 8 hrs</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.collectBtn} onPress={handleCollect}>
            <Text style={styles.collectText}>Collect {formatCash(pendingEarnings)}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1e1e2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  title: { color: '#cdd6f4', fontSize: 22, fontWeight: '800', marginBottom: 6 },
  sub: { color: '#a6adc8', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  earned: { color: '#a6e3a1', fontSize: 36, fontWeight: '900' },
  earneLabel: { color: '#585b70', fontSize: 12, marginBottom: 24 },
  adBtn: {
    backgroundColor: '#f9e2af',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginBottom: 10,
    width: '100%',
    alignItems: 'center',
  },
  adBtnText: { color: '#1e1e2e', fontWeight: '700', fontSize: 14 },
  collectBtn: {
    backgroundColor: '#313244',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  collectText: { color: '#a6adc8', fontSize: 14 },
});

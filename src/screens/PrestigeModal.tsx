import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../game/store';
import { getPrestigePointsGained, calcPrestigeMultiplier } from '../game/generators';
import { formatCash } from '../game/format';
import { trackEvent } from '../analytics/analytics';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PrestigeModal({ visible, onClose }: Props) {
  const { lifetimeCash, prestigePoints, prestige } = useGameStore(
    useShallow((s) => ({
      lifetimeCash: s.lifetimeCash,
      prestigePoints: s.prestigePoints,
      prestige: s.prestige,
    })),
  );

  const gained = getPrestigePointsGained(lifetimeCash);
  const newTotal = prestigePoints + gained;
  const newMultiplier = calcPrestigeMultiplier(newTotal);
  const canPrestige = gained > 0;

  const handlePrestige = () => {
    prestige();
    trackEvent('prestige', { points_gained: gained, new_total: newTotal });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>🌟 Prestige</Text>
          <Text style={styles.subtitle}>
            Reset your business empire for permanent multipliers.
          </Text>

          <View style={styles.statRow}>
            <Text style={styles.label}>Lifetime earnings</Text>
            <Text style={styles.value}>{formatCash(lifetimeCash)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.label}>Prestige points gained</Text>
            <Text style={[styles.value, !canPrestige && styles.dim]}>
              {canPrestige ? `+${gained}` : 'Need $1M lifetime'}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.label}>New earnings multiplier</Text>
            <Text style={styles.value}>{newMultiplier.toFixed(1)}×</Text>
          </View>

          <TouchableOpacity
            style={[styles.prestigeBtn, !canPrestige && styles.disabled]}
            onPress={handlePrestige}
            disabled={!canPrestige}
          >
            <Text style={styles.prestigeBtnText}>Prestige Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Not yet</Text>
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
  },
  title: { color: '#cdd6f4', fontSize: 22, fontWeight: '800', textAlign: 'center', marginBottom: 6 },
  subtitle: { color: '#a6adc8', fontSize: 13, textAlign: 'center', marginBottom: 20 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#313244',
  },
  label: { color: '#a6adc8', fontSize: 14 },
  value: { color: '#cdd6f4', fontWeight: '700', fontSize: 14 },
  dim: { color: '#585b70' },
  prestigeBtn: {
    backgroundColor: '#cba6f7',
    borderRadius: 10,
    paddingVertical: 14,
    marginTop: 20,
    alignItems: 'center',
  },
  disabled: { backgroundColor: '#313244' },
  prestigeBtnText: { color: '#1e1e2e', fontWeight: '800', fontSize: 16 },
  cancelBtn: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { color: '#585b70', fontSize: 14 },
});

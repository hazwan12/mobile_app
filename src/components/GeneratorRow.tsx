import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { GeneratorDef } from '../game/types';
import { getGeneratorCost } from '../game/generators';
import { formatCash } from '../game/format';
import { useGameStore } from '../game/store';

interface Props {
  def: GeneratorDef;
  count: number;
  qty: number; // buy qty (1 or 10)
}

export default function GeneratorRow({ def, count, qty }: Props) {
  const { cash, buyGenerator } = useGameStore((s) => ({
    cash: s.cash,
    buyGenerator: s.buyGenerator,
  }));

  const cost =
    qty === 1
      ? getGeneratorCost(def, count)
      : (() => {
          let total = 0;
          for (let i = 0; i < qty; i++) total += getGeneratorCost(def, count + i);
          return total;
        })();

  const canAfford = cash >= cost;

  return (
    <View style={styles.row}>
      <Text style={styles.emoji}>{def.emoji}</Text>
      <View style={styles.info}>
        <Text style={styles.name}>{def.name}</Text>
        <Text style={styles.rate}>
          {formatCash(def.baseRate * Math.max(count, 1))}/sec each
        </Text>
      </View>
      <Text style={styles.count}>x{count}</Text>
      <TouchableOpacity
        style={[styles.buyBtn, !canAfford && styles.buyBtnDisabled]}
        onPress={() => buyGenerator(def.id, qty)}
        disabled={!canAfford}
      >
        <Text style={styles.buyQty}>Buy {qty}</Text>
        <Text style={styles.buyCost}>{formatCash(cost)}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e1e2e',
    borderRadius: 10,
    marginVertical: 4,
    marginHorizontal: 12,
    padding: 10,
  },
  emoji: { fontSize: 28, width: 40 },
  info: { flex: 1, marginLeft: 8 },
  name: { color: '#cdd6f4', fontWeight: '700', fontSize: 14 },
  rate: { color: '#a6adc8', fontSize: 11, marginTop: 2 },
  count: { color: '#89dceb', fontWeight: '700', fontSize: 16, marginRight: 8, minWidth: 36, textAlign: 'center' },
  buyBtn: {
    backgroundColor: '#89b4fa',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: 'center',
    minWidth: 72,
  },
  buyBtnDisabled: { backgroundColor: '#313244' },
  buyQty: { color: '#1e1e2e', fontWeight: '700', fontSize: 12 },
  buyCost: { color: '#1e1e2e', fontSize: 11 },
});

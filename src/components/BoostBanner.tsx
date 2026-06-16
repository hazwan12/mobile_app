import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useGameStore } from '../game/store';
import { formatDuration } from '../game/format';

export default function BoostBanner() {
  const activeBoost = useGameStore((s) => s.activeBoost);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!activeBoost) return;
    const update = () => setRemaining(Math.max(0, activeBoost.expiresAt - Date.now()));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [activeBoost]);

  if (!activeBoost || remaining <= 0) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>⚡ 2× Earnings active — {formatDuration(remaining)} left</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f9e2af',
    paddingVertical: 6,
    alignItems: 'center',
  },
  text: { color: '#1e1e2e', fontWeight: '700', fontSize: 13 },
});

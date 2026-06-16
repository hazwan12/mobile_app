// Number formatting for idle-game cash display
const SUFFIXES = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'];

export function formatCash(n: number): string {
  if (n < 1000) return `$${Math.floor(n)}`;
  const tier = Math.floor(Math.log10(n) / 3);
  const clamped = Math.min(tier, SUFFIXES.length - 1);
  const scaled = n / Math.pow(1000, clamped);
  return `$${scaled.toFixed(2)}${SUFFIXES[clamped]}`;
}

export function formatRate(perSec: number): string {
  return `${formatCash(perSec)}/sec`;
}

export function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

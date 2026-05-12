function scoreHue(mark: number): number {
  const clamped = Math.max(0, Math.min(20, mark));
  return (clamped / 20) * 120;
}

export function scoreColorStyle(bestMark?: number): React.CSSProperties {
  if (bestMark === undefined) return {};
  return { backgroundColor: `oklch(0.55 0.17 ${scoreHue(bestMark)})` };
}

export function scoreColorClass(bestMark?: number): string {
  if (bestMark === undefined) return "bg-score-done";
  return "";
}

export function markTextColorStyle(value: number): React.CSSProperties {
  return { color: `oklch(0.55 0.17 ${scoreHue(value)})` };
}

export function scoreColor(bestMark?: number): string {
  if (bestMark === undefined) return "bg-score-done hover:bg-score-done/80";
  if (bestMark >= 16)
    return "bg-score-distinction hover:bg-score-distinction/80";
  if (bestMark >= 12) return "bg-score-merit hover:bg-score-merit/80";
  if (bestMark >= 8) return "bg-score-pass hover:bg-score-pass/80";
  return "bg-score-fail hover:bg-score-fail/80";
}

export function scoreColorStatic(bestMark?: number): string {
  if (bestMark === undefined) return "bg-score-done";
  if (bestMark >= 16) return "bg-score-distinction";
  if (bestMark >= 12) return "bg-score-merit";
  if (bestMark >= 8) return "bg-score-pass";
  return "bg-score-fail";
}

export function markTextColor(value: number): string {
  if (value >= 15) return "text-score-distinction";
  if (value >= 10) return "text-score-merit";
  return "text-score-fail";
}

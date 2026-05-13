// Hand-picked vibrant oklch stops: [mark, lightness, chroma, hue]
const stops: [number, number, number, number][] = [
  [0, 0.55, 0.27, 29],   // red
  [7, 0.70, 0.22, 55],   // orange
  [13, 0.82, 0.19, 95],  // yellow
  [20, 0.72, 0.22, 145], // green
];

function interpolate(mark: number): [number, number, number] {
  const m = Math.max(0, Math.min(20, mark));
  for (let i = 1; i < stops.length; i++) {
    if (m <= stops[i][0]) {
      const t = (m - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
      return [
        stops[i - 1][1] + t * (stops[i][1] - stops[i - 1][1]),
        stops[i - 1][2] + t * (stops[i][2] - stops[i - 1][2]),
        stops[i - 1][3] + t * (stops[i][3] - stops[i - 1][3]),
      ];
    }
  }
  const last = stops[stops.length - 1];
  return [last[1], last[2], last[3]];
}

function scoreOklch(mark: number): string {
  const [l, c, h] = interpolate(mark);
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
}

export function scoreColorStyle(bestMark?: number): React.CSSProperties {
  if (bestMark === undefined) return {};
  return { backgroundColor: scoreOklch(bestMark) };
}

export function scoreColorClass(bestMark?: number): string {
  if (bestMark === undefined) return "bg-score-done";
  return "";
}

export function markTextColorStyle(value: number): React.CSSProperties {
  return { color: scoreOklch(value) };
}

export const gradientCss =
  "linear-gradient(to right in oklch, oklch(0.55 0.27 29), oklch(0.70 0.22 55), oklch(0.82 0.19 95), oklch(0.72 0.22 145))";

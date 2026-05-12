"use client";

import { useId, useMemo } from "react";

export const MarkDistributionGraph = (data: {
  minimum: number;
  maximum: number;
  median: number;
  attempts: number;
}) => {
  const gradientId = useId();

  const stats = useMemo(() => {
    const { minimum: a, maximum: b, median: m, attempts: n } = data;

    const mean = n <= 25 ? (a + 2 * m + b) / 4 : m;

    let variance: number;
    if (n <= 15) {
      variance = (1 / 12) * ((a - 2 * m + b) ** 2 / 4 + (b - a) ** 2);
    } else if (n <= 70) {
      variance = ((b - a) / 4) ** 2;
    } else {
      variance = ((b - a) / 6) ** 2;
    }

    const standardDeviation = Math.sqrt(variance);
    const skewness =
      standardDeviation > 0 ? (mean - m) / standardDeviation : 0;

    return { mean, standardDeviation, skewness };
  }, [data.minimum, data.maximum, data.median, data.attempts]);

  const curvePoints = useMemo(() => {
    const { mean, standardDeviation, skewness } = stats;
    if (standardDeviation === 0) return [];

    const points: [number, number][] = [];
    const width = 300;
    const height = 150;

    for (let x = 0; x <= 20; x += 0.2) {
      const z = (x - mean) / standardDeviation;
      let y = Math.exp(-(z ** 2) / 2);
      y *= 1 + (skewness * (z - z ** 3 / 6)) / 3;

      const xPos = (x / 20) * width;
      const yPos = height - (y * height) / 1.5;
      points.push([xPos, yPos]);
    }

    return points;
  }, [stats]);

  const pathData = curvePoints
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point[0]},${point[1]}`)
    .join(" ");

  if (curvePoints.length === 0) return null;

  return (
    <div className="h-28 w-48">
      <svg width="100%" height="100%" viewBox="-5 0 310 160">
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="0.2" />
            <stop
              offset="100%"
              stopColor="var(--chart-1)"
              stopOpacity="0.05"
            />
          </linearGradient>
        </defs>

        <path
          d={`${pathData} L 300,150 L 0,150 Z`}
          fill={`url(#${gradientId})`}
        />
        <path
          d={pathData}
          fill="none"
          stroke="var(--chart-1)"
          strokeWidth="4"
        />

        <line
          x1="0"
          y1="150"
          x2="300"
          y2="150"
          stroke="var(--muted-foreground)"
          strokeWidth="1"
        />

        <line
          x1={(data.minimum / 20) * 300}
          y1="10"
          x2={(data.minimum / 20) * 300}
          y2="150"
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={(data.median / 20) * 300}
          y1="10"
          x2={(data.median / 20) * 300}
          y2="150"
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={(data.maximum / 20) * 300}
          y1="10"
          x2={(data.maximum / 20) * 300}
          y2="150"
          stroke="var(--muted-foreground)"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        <text x="-5" y="158" className="fill-muted-foreground text-[10px]">
          0
        </text>
        <text x="290" y="158" className="fill-muted-foreground text-[10px]">
          20
        </text>
      </svg>
    </div>
  );
};

export default MarkDistributionGraph;

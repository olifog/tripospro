"use client";

import { useEffect, useState } from "react";

export const MarkDistributionGraph = (data: {
  minimum: number;
  maximum: number;
  median: number;
  attempts: number;
}) => {
  // State for calculated statistics
  const [stats, setStats] = useState({
    mean: 0,
    standardDeviation: 0,
    skewness: 0
  });

  // Calculate distribution parameters based on input data
  useEffect(() => {
    const { minimum: a, maximum: b, median: m, attempts: n } = data;

    // Calculate mean using formula (5) from the image
    let mean: number;
    if (n <= 25) {
      mean = (a + 2 * m + b) / 4; // Formula (5) for small samples
    } else {
      mean = m; // For samples > 25, median is the best estimator
    }

    // Calculate variance using appropriate formula based on sample size
    let variance: number;
    if (n <= 15) {
      // Formula (16) for very small samples
      variance = (1 / 12) * ((a - 2 * m + b) ** 2 / 4 + (b - a) ** 2);
    } else if (n <= 70) {
      // Range/4 for medium samples
      variance = ((b - a) / 4) ** 2;
    } else {
      // Range/6 for large samples
      variance = ((b - a) / 6) ** 2;
    }

    const standardDeviation = Math.sqrt(variance);

    // Calculate skewness based on the difference between mean and median
    const skewness = (mean - m) / standardDeviation;

    setStats({ mean, standardDeviation, skewness });
  }, [data]);

  // Generate points for the curve
  const generateCurvePoints = () => {
    const { mean, standardDeviation, skewness } = stats;
    const points = [];
    const width = 300;
    const height = 150;

    // Generate a skewed normal distribution
    for (let x = 0; x <= 20; x += 0.2) {
      // Convert mark value to standard normal z-score
      const z = (x - mean) / standardDeviation;

      // Basic normal distribution
      let y = Math.exp(-(z ** 2) / 2);

      // Apply skewness (simple approximation using skewness factor)
      y *= 1 + (skewness * (z - z ** 3 / 6)) / 3;

      // Scale and add to points
      const xPos = (x / 20) * width;
      const yPos = height - (y * height) / 1.5;
      points.push([xPos, yPos]);
    }

    return points;
  };

  const curvePoints = generateCurvePoints();
  const pathData = curvePoints
    .map((point, i) => `${i === 0 ? "M" : "L"} ${point[0]},${point[1]}`)
    .join(" ");

  return (
    <div className="relative h-32 w-full max-w-[18rem]">
      <svg width="100%" height="100%" viewBox="-10 0 320 175">
        {/* Gradient definition */}
        <defs>
          <linearGradient id="curveGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4F46E5" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Distribution curve with fill */}
        <path
          d={`${pathData} L 300,150 L 0,150 Z`}
          fill="url(#curveGradient)"
        />
        <path d={pathData} fill="none" stroke="#4F46E5" strokeWidth="4" />

        {/* Bottom line */}
        <line
          x1="0"
          y1="150"
          x2="300"
          y2="150"
          stroke="#94A3B8"
          strokeWidth="1"
        />

        {/* Mark vertical lines */}
        <line
          x1={(data.minimum / 20) * 300}
          y1="40"
          x2={(data.minimum / 20) * 300}
          y2="150"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={(data.median / 20) * 300}
          y1="40"
          x2={(data.median / 20) * 300}
          y2="150"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="2,2"
        />
        <line
          x1={(data.maximum / 20) * 300}
          y1="40"
          x2={(data.maximum / 20) * 300}
          y2="150"
          stroke="#94A3B8"
          strokeWidth="1"
          strokeDasharray="2,2"
        />

        {/* Axis labels */}
        <text x="-5 " y="168" className="fill-gray-500 text-md">
          0
        </text>
        <text x="142" y="168" className="fill-gray-500 text-md">
          10
        </text>
        <text x="290" y="168" className="fill-gray-500 text-md">
          20
        </text>

        {/* Data point labels */}
        <text
          x={(data.minimum / 20) * 300 - 13}
          y="18"
          className="fill-gray-500 text-md"
        >
          Min
        </text>
        <text
          x={(data.minimum / 20) * 300 - 4}
          y="34"
          className="fill-gray-800 text-md dark:fill-gray-400"
        >
          {data.minimum}
        </text>
        <text
          x={(data.median / 20) * 300 - 14}
          y="18"
          className="fill-gray-500 text-md"
        >
          Med
        </text>
        <text
          x={(data.median / 20) * 300 - 8}
          y="34"
          className="fill-gray-800 text-md dark:fill-gray-400"
        >
          {data.median}
        </text>
        <text
          x={(data.maximum / 20) * 300 - 15}
          y="18"
          className="fill-gray-500 text-md"
        >
          Max
        </text>
        <text
          x={(data.maximum / 20) * 300 - 9}
          y="34"
          className="fill-gray-800 text-md dark:fill-gray-400"
        >
          {data.maximum}
        </text>
      </svg>
    </div>
  );
};

export default MarkDistributionGraph;

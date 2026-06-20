"use client";

import { RiskLevel } from "@/types";

interface RiskMeterProps {
  riskLevel: RiskLevel;
}

const bgMap = {
  safe: "bg-green-500",
  caution: "bg-yellow-400",
  danger: "bg-orange-500",
  critical: "bg-red-600",
};

const borderMap = {
  safe: "border-green-500",
  caution: "border-yellow-400",
  danger: "border-orange-500",
  critical: "border-red-600",
};

const textMap = {
  safe: "text-green-600",
  caution: "text-yellow-600",
  danger: "text-orange-600",
  critical: "text-red-600",
};

export default function RiskMeter({ riskLevel }: RiskMeterProps) {
  const bg = bgMap[riskLevel.level];
  const border = borderMap[riskLevel.level];
  const text = textMap[riskLevel.level];

  return (
    <div className={`rounded-2xl border-2 ${border} p-6 text-center`}>
      <p className="text-sm text-gray-500 mb-1">종합 위험도</p>
      <p className={`text-4xl font-black ${text} mb-2`}>{riskLevel.label}</p>
      <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
        <div
          className={`h-4 rounded-full ${bg} transition-all duration-700`}
          style={{ width: `${riskLevel.score}%` }}
        />
      </div>
      <p className={`text-2xl font-bold ${text}`}>{riskLevel.score} / 100</p>
    </div>
  );
}

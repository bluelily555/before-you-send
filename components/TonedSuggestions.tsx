"use client";

import { useState } from "react";
import { TonedSuggestion } from "@/types";

interface TonedSuggestionsProps {
  suggestions: TonedSuggestion[];
  onSelect: (message: string) => void;
}

const toneStyles = {
  formal: {
    bg: "bg-slate-50",
    border: "border-slate-300",
    badge: "bg-slate-700 text-white",
    button: "bg-slate-700 hover:bg-slate-800 text-white",
    score: "text-slate-700",
  },
  friendly: {
    bg: "bg-green-50",
    border: "border-green-300",
    badge: "bg-green-500 text-white",
    button: "bg-green-500 hover:bg-green-600 text-white",
    score: "text-green-700",
  },
  humorous: {
    bg: "bg-yellow-50",
    border: "border-yellow-300",
    badge: "bg-yellow-400 text-gray-900",
    button: "bg-yellow-400 hover:bg-yellow-500 text-gray-900",
    score: "text-yellow-700",
  },
};

function RiskBadge({ score }: { score: number }) {
  const color =
    score < 30
      ? "text-green-600 bg-green-100"
      : score < 60
      ? "text-yellow-700 bg-yellow-100"
      : score < 80
      ? "text-orange-600 bg-orange-100"
      : "text-red-600 bg-red-100";
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${color}`}>
      위험도 {score}
    </span>
  );
}

export default function TonedSuggestions({
  suggestions,
  onSelect,
}: TonedSuggestionsProps) {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = async (tone: string, message: string) => {
    await navigator.clipboard.writeText(message);
    setCopied(tone);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-700 flex items-center gap-2">
        <span className="text-lg">✨</span>
        안전한 대안 메시지 — 3가지 톤
      </h3>
      <div className="grid grid-cols-1 gap-3">
        {suggestions.map((s) => {
          const style = toneStyles[s.tone];
          const isCopied = copied === s.tone;
          return (
            <div
              key={s.tone}
              className={`rounded-xl border-2 ${style.border} ${style.bg} p-4 transition-all duration-200`}
            >
              {/* 헤더 */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{s.emoji}</span>
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded-full ${style.badge}`}
                  >
                    {s.label}
                  </span>
                </div>
                <RiskBadge score={s.riskScore} />
              </div>

              {/* 메시지 */}
              <p className="text-sm text-gray-700 leading-relaxed mb-3 italic">
                &ldquo;{s.message}&rdquo;
              </p>

              {/* 버튼 2개 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(s.tone, s.message)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${style.button} flex items-center justify-center gap-1`}
                >
                  {isCopied ? (
                    <><span>✅</span> 복사됨!</>
                  ) : (
                    <><span>📋</span> 복사하기</>
                  )}
                </button>
                <button
                  onClick={() => onSelect(s.message)}
                  className="flex-1 py-2 text-xs font-bold rounded-lg border-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition-all flex items-center justify-center gap-1"
                >
                  <span>✍️</span> 입력창에 적용
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

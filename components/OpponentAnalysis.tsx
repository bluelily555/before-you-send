"use client";

import { OpponentAnalyzeResponse, PatternTag } from "@/types";

interface Props {
  result: OpponentAnalyzeResponse;
}

const styleColors: Record<string, { bg: string; border: string; text: string; bar: string }> = {
  assertive:         { bg: "bg-blue-50",   border: "border-blue-300",   text: "text-blue-700",   bar: "bg-blue-500" },
  aggressive:        { bg: "bg-red-50",    border: "border-red-300",    text: "text-red-700",    bar: "bg-red-500" },
  passive:           { bg: "bg-gray-50",   border: "border-gray-300",   text: "text-gray-600",   bar: "bg-gray-400" },
  "passive-aggressive": { bg: "bg-orange-50", border: "border-orange-300", text: "text-orange-700", bar: "bg-orange-500" },
  collaborative:     { bg: "bg-green-50",  border: "border-green-300",  text: "text-green-700",  bar: "bg-green-500" },
};

const severityStyle: Record<PatternTag["severity"], string> = {
  low:    "bg-gray-100 text-gray-600 border border-gray-200",
  medium: "bg-yellow-100 text-yellow-700 border border-yellow-300",
  high:   "bg-red-100 text-red-700 border border-red-300",
};

const severityLabel: Record<PatternTag["severity"], string> = {
  low: "낮음", medium: "주의", high: "경고",
};

function PowerBar({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score));
  const pct = (clamped + 100) / 2; // 0~100%
  const color = clamped < -20 ? "bg-red-400" : clamped > 20 ? "bg-green-400" : "bg-yellow-400";
  const label = clamped < -30 ? "상대방 주도" : clamped > 30 ? "내가 주도" : "균형";

  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>상대방 주도 ◀</span>
        <span className="font-bold">{label}</span>
        <span>▶ 내가 주도</span>
      </div>
      <div className="relative w-full bg-gray-200 rounded-full h-3">
        <div className="absolute left-1/2 top-0 w-0.5 h-3 bg-gray-400 z-10" />
        <div
          className={`h-3 rounded-full ${color} transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-1">{score > 0 ? `+${score}` : score} / 100</p>
    </div>
  );
}

export default function OpponentAnalysis({ result }: Props) {
  const style = styleColors[result.communicationStyle.type] ?? styleColors.assertive;

  return (
    <div className="space-y-5 animate-fadeIn">

      {/* 소통 방식 */}
      <div className={`rounded-xl border-2 ${style.border} ${style.bg} p-5`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">{result.communicationStyle.emoji}</span>
          <div>
            <p className="text-xs text-gray-500">소통 방식</p>
            <p className={`text-xl font-black ${style.text}`}>
              {result.communicationStyle.label}형
            </p>
          </div>
          <span className={`ml-auto text-2xl font-black ${style.text}`}>
            {result.communicationStyle.score}
          </span>
        </div>
        <div className="w-full bg-white/60 rounded-full h-2 mb-3">
          <div
            className={`h-2 rounded-full ${style.bar} transition-all duration-700`}
            style={{ width: `${result.communicationStyle.score}%` }}
          />
        </div>
        <p className="text-sm text-gray-700 leading-relaxed">
          {result.communicationStyle.description}
        </p>
      </div>

      {/* 감정 상태 */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-start gap-3">
        <span className="text-3xl">{result.emotionalState.emoji}</span>
        <div>
          <p className="text-xs text-gray-500 mb-0.5">현재 감정 상태</p>
          <p className="font-bold text-purple-700 text-base">{result.emotionalState.label}</p>
          <p className="text-sm text-gray-600 mt-1">{result.emotionalState.description}</p>
        </div>
      </div>

      {/* 주도권 분석 */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>⚖️</span> 대화 주도권
        </h3>
        <PowerBar score={result.powerDynamics.score} />
        <p className="text-sm text-gray-600 mt-2">{result.powerDynamics.description}</p>
      </div>

      {/* 감지된 패턴 태그 */}
      {result.patternTags.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
            <span>🔍</span> 감지된 대화 패턴
          </h3>
          <div className="space-y-2">
            {result.patternTags.map((p, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${severityStyle[p.severity]}`}>
                    {severityLabel[p.severity]}
                  </span>
                  <span className="font-semibold text-sm text-gray-800">{p.tag}</span>
                </div>
                <p className="text-xs text-gray-500">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 경고 신호 */}
      {result.warningSignals.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-bold text-red-700 mb-2 flex items-center gap-2">
            <span>⚠️</span> 주의 신호
          </h3>
          <ul className="space-y-1">
            {result.warningSignals.map((w, i) => (
              <li key={i} className="text-red-700 text-sm flex gap-2">
                <span className="shrink-0">•</span><span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 대응 전략 */}
      <div>
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>🎯</span> 상황별 대응 전략
        </h3>
        <div className="space-y-3">
          {result.responseTips.map((tip, i) => (
            <div key={i} className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-xs font-semibold text-indigo-500 mb-1">📌 {tip.situation}</p>
              <p className="text-sm font-medium text-indigo-900 italic mb-2">
                &ldquo;{tip.message}&rdquo;
              </p>
              <p className="text-xs text-indigo-600">{tip.reason}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 전체 요약 */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          <span>📋</span> 종합 분석
        </h3>
        <p className="text-sm text-gray-600 leading-relaxed">{result.overallSummary}</p>
      </div>
    </div>
  );
}

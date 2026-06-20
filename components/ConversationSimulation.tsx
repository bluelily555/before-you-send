"use client";

import { useState } from "react";
import { SimulateResponse, SimulatedTurn } from "@/types";

interface Props {
  toneLabel: string;
  toneEmoji: string;
  selectedMessage: string;
  onClose: () => void;
  conversationHistory: string;
  opponentContext?: import("@/types").OpponentAnalyzeResponse;
}

const outcomeStyle = {
  positive: { bg: "bg-green-50", border: "border-green-300", text: "text-green-700", emoji: "🎉" },
  neutral:  { bg: "bg-yellow-50", border: "border-yellow-300", text: "text-yellow-700", emoji: "😐" },
  negative: { bg: "bg-red-50", border: "border-red-300", text: "text-red-700", emoji: "⚠️" },
};

function ChatBubble({ turn, index }: { turn: SimulatedTurn; index: number }) {
  const isMe = turn.speaker === "me";
  return (
    <div
      className={`flex flex-col gap-1 animate-fadeIn`}
      style={{ animationDelay: `${index * 120}ms` }}
    >
      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 ${isMe ? "bg-indigo-500 text-white" : "bg-gray-300 text-gray-700"}`}>
          {isMe ? "나" : "상"}
        </div>
        <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isMe
            ? "bg-indigo-500 text-white rounded-br-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
        }`}>
          {turn.message}
        </div>
      </div>
      {!isMe && (turn.emotion || turn.tip) && (
        <div className="ml-9 flex flex-wrap gap-2">
          {turn.emotion && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">
              😶 {turn.emotion}
            </span>
          )}
          {turn.tip && (
            <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full">
              💡 {turn.tip}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConversationSimulation({
  toneLabel, toneEmoji, selectedMessage, onClose, conversationHistory, opponentContext,
}: Props) {
  const [result, setResult] = useState<SimulateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSimulation = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory, selectedMessage, opponentContext }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "시뮬레이션 실패");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 모달 마운트 시 자동 실행
  if (!result && !loading && !error) {
    runSimulation();
  }

  const outcome = result ? outcomeStyle[result.outcome] : null;

  return (
    /* 모달 오버레이 */
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎭</span>
            <div>
              <p className="font-black text-gray-800 text-sm">대화 시뮬레이션</p>
              <p className="text-xs text-gray-400">{toneEmoji} {toneLabel} 버전으로 보냈을 때</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">✕</button>
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 text-indigo-400">
              <div className="text-4xl mb-3 animate-bounce">🤖</div>
              <p className="text-sm font-bold">대화 흐름 시뮬레이션 중...</p>
              <p className="text-xs text-gray-400 mt-1">AI가 대화 전개를 예측하고 있어요</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm text-center">
              ⚠️ {error}
              <button onClick={runSimulation} className="block mx-auto mt-2 text-xs underline">다시 시도</button>
            </div>
          )}

          {result && (
            <>
              {/* 대화 버블 */}
              <div className="space-y-3 bg-gray-50 rounded-xl p-4">
                {result.turns.map((turn, i) => (
                  <ChatBubble key={i} turn={turn} index={i} />
                ))}
              </div>

              {/* 결과 */}
              {outcome && (
                <div className={`rounded-xl border-2 ${outcome.border} ${outcome.bg} p-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{outcome.emoji}</span>
                    <div>
                      <p className="text-xs text-gray-500">예상 결과</p>
                      <p className={`font-black text-base ${outcome.text}`}>{result.outcomeLabel}</p>
                    </div>
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-400">위험도 변화</p>
                      <p className={`font-black text-sm ${result.riskDelta <= 0 ? "text-green-600" : "text-red-600"}`}>
                        {result.riskDelta <= 0 ? `▼ ${Math.abs(result.riskDelta)}` : `▲ +${result.riskDelta}`}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{result.outcomeSummary}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

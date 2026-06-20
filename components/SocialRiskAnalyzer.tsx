"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyzeResponse } from "@/types";
import AnalysisResult from "@/components/AnalysisResult";

export default function SocialRiskAnalyzer() {
  const searchParams = useSearchParams();

  const [conversationHistory, setConversationHistory] = useState("");
  const [messageToSend, setMessageToSend] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRunFired = useRef(false);

  // URL 파라미터로 자동 입력 & 자동 실행
  useEffect(() => {
    const history = searchParams.get("history") ?? "";
    const message = searchParams.get("message") ?? "";
    const autorun = searchParams.get("autorun") === "1";

    if (history) setConversationHistory(decodeURIComponent(history));
    if (message) setMessageToSend(decodeURIComponent(message));

    if (autorun && message && !autoRunFired.current) {
      autoRunFired.current = true;
      runAnalysis(decodeURIComponent(history), decodeURIComponent(message));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const runAnalysis = async (history: string, message: string) => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationHistory: history,
          messageToSend: message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => runAnalysis(conversationHistory, messageToSend);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-xl font-black text-gray-900">
              보내기 전에
            </h1>
            <p className="text-xs text-gray-500">
              Before You Send · Powered by GitHub Copilot SDK + Azure AI
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
              Copilot SDK
            </span>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">
              Azure AI
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 입력 영역 */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">💬</span>
                대화 히스토리
                <span className="text-xs font-normal text-gray-400">(선택사항)</span>
              </label>
              <textarea
                className="w-full h-48 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50"
                placeholder={`이전 대화 내용을 붙여넣으세요.\n\n예시:\n팀장: 이번 프로젝트 진행 상황이 어떻게 되나요?\n나: 현재 70% 완료되었습니다.`}
                value={conversationHistory}
                onChange={(e) => setConversationHistory(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">✍️</span>
                보낼 메시지
                <span className="text-xs font-normal text-red-400">(필수)</span>
              </label>
              <textarea
                className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50"
                placeholder="위험도를 분석할 메시지를 입력하세요."
                value={messageToSend}
                onChange={(e) => setMessageToSend(e.target.value)}
              />
              <div className="mt-2 text-right text-xs text-gray-400">
                {messageToSend.length}자
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={loading || !messageToSend.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  분석 중...
                </>
              ) : (
                <><span>🔍</span>사회생활 위험도 분석</>
              )}
            </button>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}
          </div>

          {/* 결과 영역 */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
            <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
              <span className="text-lg">📈</span>분석 결과
            </h2>

            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <span className="text-5xl mb-4">🛡️</span>
                <p className="text-sm text-center">메시지를 입력하고<br />분석 버튼을 눌러주세요</p>
              </div>
            )}

            {loading && (
              <div className="flex flex-col items-center justify-center h-64 text-indigo-400">
                <div className="text-5xl mb-4 animate-bounce">🤖</div>
                <p className="text-sm text-center">
                  AI가 위험도를 분석하고 있습니다...<br />
                  <span className="text-xs text-gray-400">Copilot SDK 처리 중</span>
                </p>
              </div>
            )}

            {result && <AnalysisResult result={result} onSelectMessage={setMessageToSend} />}
          </div>
        </div>
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        천하제일 입코딩 대회 | 보내기 전에 (Before You Send) · Copilot SDK + Azure AI
      </footer>
    </main>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { AnalyzeResponse, OpponentAnalyzeResponse } from "@/types";
import AnalysisResult from "@/components/AnalysisResult";
import OpponentAnalysis from "@/components/OpponentAnalysis";

type Tab = "risk" | "opponent";

export default function SocialRiskAnalyzer() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<Tab>("risk");

  // 모델 선택 상태
  const MODELS = [
    { id: "gpt-4o-mini",                    label: "GPT-4o mini",        limit: "200회/일" },
    { id: "gpt-4o",                         label: "GPT-4o",             limit: "50회/일" },
    { id: "meta-llama-3.1-70b-instruct",    label: "Llama 3.1 70B",      limit: "무제한에 가까움" },
    { id: "meta-llama-3.1-8b-instruct",     label: "Llama 3.1 8B",       limit: "무제한에 가까움" },
  ];
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);

  // 위험도 분석 상태
  const [conversationHistory, setConversationHistory] = useState("");
  const [messageToSend, setMessageToSend] = useState("");
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<"opponent" | "risk" | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 상대방 분석 상태
  const [oppHistory, setOppHistory] = useState("");
  const [oppResult, setOppResult] = useState<OpponentAnalyzeResponse | null>(null);
  const [oppLoading, setOppLoading] = useState(false);
  const [oppError, setOppError] = useState<string | null>(null);

  const autoRunFired = useRef(false);

  useEffect(() => {
    const history = searchParams.get("history") ?? "";
    const message = searchParams.get("message") ?? "";
    const autorun = searchParams.get("autorun") === "1";
    const tab = searchParams.get("tab") as Tab | null;
    const oppHistoryParam = searchParams.get("opp") ?? "";

    // 탭 전환
    if (tab === "opponent" || tab === "risk") setActiveTab(tab);

    // 위험도 탭 자동입력
    if (history) setConversationHistory(decodeURIComponent(history));
    if (message) setMessageToSend(decodeURIComponent(message));
    if (autorun && message && !autoRunFired.current) {
      autoRunFired.current = true;
      runRiskAnalysis(decodeURIComponent(history), decodeURIComponent(message));
    }

    // 상대방 분석 탭 자동입력 & 자동실행
    if (oppHistoryParam) {
      const decoded = decodeURIComponent(oppHistoryParam);
      setOppHistory(decoded);
      if (autorun && !autoRunFired.current) {
        autoRunFired.current = true;
        setTimeout(() => runOpponentAnalysisWith(decoded), 100);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const runRiskAnalysis = async (history: string, message: string) => {
    if (!message.trim()) return;
    setLoading(true); setError(null); setResult(null);

    let opponentCtx: OpponentAnalyzeResponse | undefined;

    // 1단계: 대화 히스토리가 있으면 상대방 분석 먼저 수행
    if (history.trim()) {
      setLoadingStep("opponent");
      try {
        const oppRes = await fetch("/api/analyze-opponent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationHistory: history, model: selectedModel }),
        });
        if (oppRes.ok) {
          opponentCtx = await oppRes.json();
          setOppHistory(history);
          setOppResult(opponentCtx ?? null);
        }
      } catch {
        // 상대방 분석 실패해도 위험도 분석은 계속 진행
      }
    }

    // 2단계: 상대방 분석 결과를 반영해 위험도 분석
    setLoadingStep("risk");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history, messageToSend: message, opponentContext: opponentCtx, model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
      setLoadingStep(null);
    }
  };

  const runOpponentAnalysisWith = async (history: string) => {
    if (!history.trim()) return;
    setOppLoading(true); setOppError(null); setOppResult(null);
    try {
      const res = await fetch("/api/analyze-opponent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationHistory: history, model: selectedModel }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "분석 실패");
      setOppResult(data);
    } catch (e) {
      setOppError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setOppLoading(false);
    }
  };

  const runOpponentAnalysis = () => runOpponentAnalysisWith(oppHistory);

  const tabs: { id: Tab; label: string; emoji: string; desc: string }[] = [
    { id: "risk",     label: "메시지 위험도",  emoji: "🛡️", desc: "보내기 전 위험도 분석" },
    { id: "opponent", label: "상대방 분석",    emoji: "🔎", desc: "대화 패턴 & 소통 방식" },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <span className="text-3xl">🛡️</span>
          <div>
            <h1 className="text-xl font-black text-gray-900">보내기 전에</h1>
            <p className="text-xs text-gray-500">Before You Send · Powered by GitHub Copilot SDK + Azure AI</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="text-xs border border-gray-200 rounded-full px-3 py-1 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
              title="AI 모델 선택"
            >
              {MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.label} ({m.limit})</option>
              ))}
            </select>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">Copilot SDK</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-medium">Azure AI</span>
            <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">Extension API</span>
          </div>
        </div>
      </header>

      {/* 탭 */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-200 w-fit">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeTab === t.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              <span>{t.emoji}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2 ml-1">
          {tabs.find(t => t.id === activeTab)?.desc}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">

        {/* ── 탭 1: 메시지 위험도 분석 ── */}
        {activeTab === "risk" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">💬</span>대화 히스토리
                  <span className="text-xs font-normal text-gray-400">(선택사항)</span>
                </label>
                <textarea
                  className="w-full h-48 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50"
                  placeholder={`이전 대화 내용을 붙여넣으세요.\n\n예시:\n팀장: 진행 상황이 어떻게 되나요?\n나: 70% 완료되었습니다.`}
                  value={conversationHistory}
                  onChange={(e) => setConversationHistory(e.target.value)}
                />
              </div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">✍️</span>보낼 메시지
                  <span className="text-xs font-normal text-red-400">(필수)</span>
                </label>
                <textarea
                  className="w-full h-32 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition bg-gray-50"
                  placeholder="위험도를 분석할 메시지를 입력하세요."
                  value={messageToSend}
                  onChange={(e) => setMessageToSend(e.target.value)}
                />
                <div className="mt-2 text-right text-xs text-gray-400">{messageToSend.length}자</div>
              </div>
              <button
                onClick={() => runRiskAnalysis(conversationHistory, messageToSend)}
                disabled={loading || !messageToSend.trim()}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all shadow-md flex items-center justify-center gap-3"
              >
                {loading ? (
                  <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>분석 중...</>
                ) : (<><span>🔍</span>사회생활 위험도 분석</>)}
              </button>

              {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">⚠️ {error}</div>}
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[400px]">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><span>📈</span>분석 결과</h2>
              {!result && !loading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <span className="text-5xl mb-4">🛡️</span>
                  <p className="text-sm text-center">메시지를 입력하고<br/>분석 버튼을 눌러주세요</p>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center h-64 text-indigo-400">
                  <div className="text-5xl mb-4 animate-bounce">🤖</div>
                  {loadingStep === "opponent" ? (
                    <>
                      <p className="text-sm font-bold text-purple-600">1단계: 상대방 분석 중...</p>
                      <p className="text-xs text-gray-400 mt-1">대화 패턴과 소통 방식 파악 중</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full animate-pulse">상대방 분석</span>
                        <span className="text-xs text-gray-300">→</span>
                        <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">위험도 분석</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-indigo-600">2단계: 위험도 분석 중...</p>
                      <p className="text-xs text-gray-400 mt-1">상대방 분석 결과를 반영해 평가 중</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">✓ 상대방 분석</span>
                        <span className="text-xs text-gray-400">→</span>
                        <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full animate-pulse">위험도 분석</span>
                      </div>
                    </>
                  )}
                </div>
              )}
              {result && <AnalysisResult result={result} onSelectMessage={setMessageToSend} conversationHistory={conversationHistory} opponentContext={oppResult ?? undefined} />}
            </div>
          </div>
        )}

        {/* ── 탭 2: 상대방 분석 ── */}
        {activeTab === "opponent" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <label className="block font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span className="text-lg">💬</span>분석할 대화 히스토리
                  <span className="text-xs font-normal text-red-400">(필수)</span>
                </label>
                <textarea
                  className="w-full h-72 p-3 border border-gray-200 rounded-xl text-sm text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition bg-gray-50"
                  placeholder={`상대방이 포함된 대화를 붙여넣으세요.\n\n예시:\n팀장: 왜 이렇게 일처리가 느린 거야?\n나: 죄송합니다, 최대한 빨리 하겠습니다.\n팀장: 항상 핑계만 대더니, 이번에도 그러면 어떻게 되는지 알지?\n나: 네, 알겠습니다.\n팀장: 내가 믿어야 하는지 모르겠네.`}
                  value={oppHistory}
                  onChange={(e) => setOppHistory(e.target.value)}
                />
                <div className="mt-2 text-right text-xs text-gray-400">{oppHistory.length}자</div>
              </div>
              <button
                onClick={runOpponentAnalysis}
                disabled={oppLoading || !oppHistory.trim()}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-lg rounded-2xl transition-all shadow-md flex items-center justify-center gap-3"
              >
                {oppLoading ? (
                  <><svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>분석 중...</>
                ) : (<><span>🔎</span>상대방 대화 패턴 분석</>)}
              </button>
              {oppError && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">⚠️ {oppError}</div>}

              {/* 사용 가이드 */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs font-bold text-purple-700 mb-2">📌 이런 상황에 활용하세요</p>
                <ul className="text-xs text-purple-600 space-y-1">
                  <li>• 직장 상사/동료와 갈등이 반복될 때</li>
                  <li>• 상대방의 의도를 파악하기 어려울 때</li>
                  <li>• 효과적인 대응 방법을 찾고 싶을 때</li>
                  <li>• 협상/면담 전 상대 파악이 필요할 때</li>
                </ul>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 min-h-[400px] overflow-y-auto">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><span>🔎</span>상대방 분석 결과</h2>
              {!oppResult && !oppLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                  <span className="text-5xl mb-4">🔎</span>
                  <p className="text-sm text-center">대화 히스토리를 입력하고<br/>분석 버튼을 눌러주세요</p>
                </div>
              )}
              {oppLoading && (
                <div className="flex flex-col items-center justify-center h-64 text-purple-400">
                  <div className="text-5xl mb-4 animate-bounce">🤖</div>
                  <p className="text-sm text-center">상대방 패턴 분석 중...<br/><span className="text-xs text-gray-400">Copilot SDK 처리 중</span></p>
                </div>
              )}
              {oppResult && <OpponentAnalysis result={oppResult} />}
            </div>
          </div>
        )}
      </div>

      <footer className="text-center py-6 text-xs text-gray-400">
        천하제일 입코딩 대회 | 보내기 전에 (Before You Send) · Copilot SDK + Azure AI
      </footer>
    </main>
  );
}

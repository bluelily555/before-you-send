"use client";

import { AnalyzeResponse } from "@/types";
import RiskMeter from "./RiskMeter";
import CategoryCard from "./CategoryCard";
import TonedSuggestions from "./TonedSuggestions";

interface AnalysisResultProps {
  result: AnalyzeResponse;
  onSelectMessage?: (message: string) => void;
}

export default function AnalysisResult({ result, onSelectMessage }: AnalysisResultProps) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 종합 위험도 */}
      <RiskMeter riskLevel={result.riskLevel} />

      {/* 요약 */}
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <h3 className="font-bold text-gray-700 mb-2 flex items-center gap-2">
          <span>📋</span> 분석 요약
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{result.summary}</p>
      </div>

      {/* 카테고리별 위험도 */}
      <div>
        <h3 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
          <span>📊</span> 항목별 분석
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {result.categories.map((cat) => (
            <CategoryCard key={cat.name} category={cat} />
          ))}
        </div>
      </div>

      {/* 개선 제안 */}
      {result.suggestions.length > 0 && (
        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
          <h3 className="font-bold text-blue-700 mb-2 flex items-center gap-2">
            <span>💡</span> 개선 제안
          </h3>
          <ul className="space-y-1">
            {result.suggestions.map((s, i) => (
              <li key={i} className="text-blue-700 text-sm flex gap-2">
                <span className="shrink-0">•</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 3가지 톤별 안전 메시지 */}
      {result.tonedSuggestions && result.tonedSuggestions.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <TonedSuggestions
            suggestions={result.tonedSuggestions}
            onSelect={onSelectMessage ?? (() => {})}
          />
        </div>
      )}
    </div>
  );
}

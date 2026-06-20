export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AnalyzeRequest {
  conversationHistory: string;
  messageToSend: string;
}

export interface RiskLevel {
  level: "safe" | "caution" | "danger" | "critical";
  score: number; // 0-100
  label: string;
  color: string;
}

export interface RiskCategory {
  name: string;
  score: number;
  description: string;
}

export interface TonedSuggestion {
  tone: "formal" | "friendly" | "humorous";
  label: string;      // 정중한 / 친근한 / 유머러스한
  emoji: string;
  message: string;
  riskScore: number;  // 이 버전의 예상 위험도 (0-100)
}

export interface AnalyzeResponse {
  riskLevel: RiskLevel;
  categories: RiskCategory[];
  summary: string;
  suggestions: string[];
  revisedMessage?: string;
  tonedSuggestions?: TonedSuggestion[]; // 3가지 톤별 안전 메시지
}

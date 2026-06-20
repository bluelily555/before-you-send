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

export interface AnalyzeResponse {
  riskLevel: RiskLevel;
  categories: RiskCategory[];
  summary: string;
  suggestions: string[];
  revisedMessage?: string;
}

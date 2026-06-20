export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AnalyzeRequest {
  conversationHistory: string;
  messageToSend: string;
  opponentContext?: OpponentAnalyzeResponse; // 상대방 분석 결과 (사전 분석 시 주입)
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
  label: string;
  emoji: string;
  message: string;
  riskScore: number;
}

export interface AnalyzeResponse {
  riskLevel: RiskLevel;
  categories: RiskCategory[];
  summary: string;
  suggestions: string[];
  revisedMessage?: string;
  tonedSuggestions?: TonedSuggestion[];
}

// ─── 상대방 분석 ───────────────────────────────────────────

export interface OpponentAnalyzeRequest {
  conversationHistory: string; // 분석할 대화 히스토리
}

export type CommunicationStyle =
  | "assertive"    // 주도적/직접적
  | "aggressive"   // 공격적
  | "passive"      // 수동적
  | "passive-aggressive" // 수동공격적
  | "collaborative"; // 협력적

export type EmotionalState =
  | "calm"
  | "frustrated"
  | "angry"
  | "anxious"
  | "satisfied"
  | "disappointed"
  | "neutral";

export interface PatternTag {
  tag: string;       // e.g. "책임 전가", "감정적 압박", "칭찬 후 비판"
  severity: "low" | "medium" | "high";
  description: string;
}

export interface ResponseTip {
  situation: string; // 언제 사용
  message: string;   // 추천 대응 문장
  reason: string;    // 이유
}

export interface OpponentAnalyzeResponse {
  communicationStyle: {
    type: CommunicationStyle;
    label: string;    // 한글 레이블
    emoji: string;
    description: string;
    score: number;    // 해당 스타일 강도 0-100
  };
  emotionalState: {
    type: EmotionalState;
    label: string;
    emoji: string;
    description: string;
  };
  patternTags: PatternTag[];       // 감지된 대화 패턴
  powerDynamics: {
    label: string;                 // 예) "상대방이 주도권 장악 중"
    score: number;                 // -100(상대 지배) ~ 100(나 지배)
    description: string;
  };
  warningSignals: string[];        // 주의해야 할 신호
  responseTips: ResponseTip[];     // 상황별 대응 전략
  overallSummary: string;
}

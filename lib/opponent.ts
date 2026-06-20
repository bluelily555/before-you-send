import { OpponentAnalyzeRequest, OpponentAnalyzeResponse } from "@/types";

const SYSTEM_PROMPT = `당신은 대화 심리 분석 전문가 AI입니다.
주어진 대화 히스토리에서 상대방의 대화 패턴, 감정 상태, 소통 방식을 심층 분석합니다.

반드시 아래 JSON 형식으로만 응답하세요:
{
  "communicationStyle": {
    "type": "assertive|aggressive|passive|passive-aggressive|collaborative",
    "label": "주도적|공격적|수동적|수동공격적|협력적",
    "emoji": "이모지 하나",
    "description": "소통 방식 설명 (2-3문장)",
    "score": 0-100
  },
  "emotionalState": {
    "type": "calm|frustrated|angry|anxious|satisfied|disappointed|neutral",
    "label": "침착|불만족|분노|불안|만족|실망|중립",
    "emoji": "이모지 하나",
    "description": "현재 감정 상태 설명"
  },
  "patternTags": [
    {
      "tag": "패턴 이름 (예: 책임 전가, 감정적 압박, 칭찬 후 비판, 질문으로 압박 등)",
      "severity": "low|medium|high",
      "description": "이 패턴이 대화에서 어떻게 나타났는지 설명"
    }
  ],
  "powerDynamics": {
    "label": "주도권 분석 한 줄 요약",
    "score": -100에서 100 사이 숫자 (음수=상대방 주도, 양수=나 주도, 0=균형),
    "description": "권력 역학 설명"
  },
  "warningSignals": [
    "주의해야 할 신호 1",
    "주의해야 할 신호 2"
  ],
  "responseTips": [
    {
      "situation": "언제 이 전략을 사용하면 좋은지",
      "message": "실제로 사용할 수 있는 추천 대응 문장",
      "reason": "이 대응이 효과적인 이유"
    }
  ],
  "overallSummary": "상대방 대화 방식에 대한 전체 요약 및 관계 관리 조언 (3-4문장)"
}

patternTags는 실제 대화에서 발견되는 것만 포함하세요. 없으면 빈 배열.
responseTips는 2-3개 제공하세요.`;

export async function analyzeOpponent(
  request: OpponentAnalyzeRequest,
  githubToken?: string
): Promise<OpponentAnalyzeResponse> {
  const userContent = `아래 대화 히스토리에서 상대방의 대화 패턴과 소통 방식을 분석해주세요.

[대화 히스토리]
${request.conversationHistory}`;

  const body = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });

  // 1순위: GitHub Models API
  if (githubToken) {
    try {
      const res = await fetch(
        "https://models.inference.ai.azure.com/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${githubToken}`,
            "Content-Type": "application/json",
          },
          body,
        }
      );
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content) as OpponentAnalyzeResponse;
      }
    } catch (e) {
      console.warn("GitHub Models API failed:", e);
    }
  }

  // 2순위: Azure OpenAI
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  if (azureEndpoint && azureKey) {
    try {
      const res = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: "POST",
          headers: { "api-key": azureKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content) as OpponentAnalyzeResponse;
      }
    } catch (e) {
      console.warn("Azure OpenAI failed:", e);
    }
  }

  throw new Error("AI 서비스 연결 실패.");
}

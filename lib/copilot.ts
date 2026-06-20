import { AnalyzeRequest, AnalyzeResponse } from "@/types";
import {
  createTextEvent,
  createAckEvent,
  createDoneEvent,
  createErrorsEvent,
  transformPayloadForOpenAICompatibility,
} from "@copilot-extensions/preview-sdk";

// Copilot SDK SSE 이벤트 생성 유틸 (Extension 호환 스트리밍에서 재사용)
export { createTextEvent, createAckEvent, createDoneEvent, createErrorsEvent };

// SDK의 OpenAI 호환 변환을 활용한 메시지 빌더
export function buildCopilotMessages(systemPrompt: string, userContent: string) {
  const raw = {
    messages: [
      { role: "system" as const, content: systemPrompt },
      { role: "user" as const, content: userContent },
    ],
  };
  // transformPayloadForOpenAICompatibility: Copilot SDK가 제공하는
  // 페이로드 정규화 함수 — role/content 포맷을 OpenAI 호환으로 변환
  const transformed = transformPayloadForOpenAICompatibility(raw as Parameters<typeof transformPayloadForOpenAICompatibility>[0]);
  return transformed.messages;
}

const SYSTEM_PROMPT = `당신은 사회생활 소통 전문가 AI입니다.
사용자가 보내려는 메시지가 직장/사회생활에서 얼마나 위험한지 분석합니다.

분석 항목:
1. 감정적 위험도 (공격성, 분노, 불만 표현)
2. 관계적 위험도 (상하관계, 동료관계 훼손 가능성)
3. 전문성 위험도 (비전문적 표현, 오해 소지)
4. 법적/윤리적 위험도 (차별, 모욕, 위협)

반드시 아래 JSON 형식으로만 응답하세요:
{
  "riskLevel": {
    "level": "safe|caution|danger|critical",
    "score": 0-100,
    "label": "안전|주의|위험|매우위험",
    "color": "green|yellow|orange|red"
  },
  "categories": [
    { "name": "감정적 위험도", "score": 0-100, "description": "분석 내용" },
    { "name": "관계적 위험도", "score": 0-100, "description": "분석 내용" },
    { "name": "전문성 위험도", "score": 0-100, "description": "분석 내용" },
    { "name": "법적/윤리적 위험도", "score": 0-100, "description": "분석 내용" }
  ],
  "summary": "전체 위험 분석 요약",
  "suggestions": ["개선 제안1", "개선 제안2"],
  "revisedMessage": "더 안전하게 수정된 메시지 (위험할 경우에만)",
  "tonedSuggestions": [
    {
      "tone": "formal",
      "label": "정중한",
      "emoji": "💼",
      "message": "격식체로 정중하고 전문적으로 재작성한 메시지",
      "riskScore": 0-100
    },
    {
      "tone": "friendly",
      "label": "친근한",
      "emoji": "😊",
      "message": "부드럽고 친근하게 재작성한 메시지",
      "riskScore": 0-100
    },
    {
      "tone": "humorous",
      "label": "유머러스한",
      "emoji": "😄",
      "message": "가볍고 유머러스하게 재작성한 메시지 (관계를 풀어주는 톤)",
      "riskScore": 0-100
    }
  ]
}

tonedSuggestions는 원본 메시지의 핵심 의도를 살리되, 각 톤에 맞게 안전하게 재작성해야 합니다.
원본이 이미 안전(score 30 이하)해도 반드시 3가지 톤 버전을 제공하세요.`;

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  systemPrompt: string,
  userContent: string
): Promise<AnalyzeResponse> {
  // Copilot SDK의 buildCopilotMessages로 메시지 구성
  const messages = buildCopilotMessages(systemPrompt, userContent);

  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err?.error?.message || `API error ${response.status}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI 응답이 비어있습니다.");
  return JSON.parse(content) as AnalyzeResponse;
}

export async function analyzeWithCopilot(
  request: AnalyzeRequest,
  githubToken?: string
): Promise<AnalyzeResponse> {

  // 상대방 분석 컨텍스트 문자열 생성
  const opponentSection = request.opponentContext
    ? `
[사전 상대방 분석 결과 - 이 정보를 반드시 위험도 평가에 반영하세요]
- 소통 방식: ${request.opponentContext.communicationStyle.label}형 (강도 ${request.opponentContext.communicationStyle.score}/100)
  설명: ${request.opponentContext.communicationStyle.description}
- 감정 상태: ${request.opponentContext.emotionalState.label} ${request.opponentContext.emotionalState.description}
- 대화 주도권: ${request.opponentContext.powerDynamics.label} (점수 ${request.opponentContext.powerDynamics.score})
  설명: ${request.opponentContext.powerDynamics.description}
- 감지된 패턴: ${request.opponentContext.patternTags.map(p => `${p.tag}(${p.severity})`).join(", ")}
- 경고 신호: ${request.opponentContext.warningSignals.join(" / ")}
- 종합 분석: ${request.opponentContext.overallSummary}

→ 상대방이 ${request.opponentContext.communicationStyle.label}형이고 ${request.opponentContext.emotionalState.label} 상태임을 고려하여,
  아래 메시지가 상대방에게 어떤 반응을 유발할지 구체적으로 분석하고 위험도에 반영하세요.`
    : "";

  const userContent = `
[대화 히스토리]
${request.conversationHistory || "(없음)"}
${opponentSection}
[보내려는 메시지]
${request.messageToSend}

위 메시지의 사회생활 위험도를 분석하고, 3가지 톤(정중한/친근한/유머러스한)으로 안전한 대안 메시지도 제공해주세요.
${request.opponentContext ? "특히 상대방의 소통 방식과 감정 상태를 고려해 각 톤별 메시지를 최적화해주세요." : ""}`;

  // 1순위: GitHub Models API (Copilot SDK 호환)
  if (githubToken) {
    try {
      return await callOpenAICompatible(
        "https://models.inference.ai.azure.com",
        githubToken,
        "gpt-4o-mini",
        SYSTEM_PROMPT,
        userContent
      );
    } catch (e) {
      console.warn("GitHub Models API failed, trying Azure OpenAI:", e);
    }
  }

  // 2순위: Azure OpenAI — SDK buildCopilotMessages 재사용
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  if (azureEndpoint && azureKey) {
    try {
      const messages = buildCopilotMessages(SYSTEM_PROMPT, userContent);
      const response = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: "POST",
          headers: {
            "api-key": azureKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            response_format: { type: "json_object" },
          }),
        }
      );
      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;
        if (content) return JSON.parse(content) as AnalyzeResponse;
      }
    } catch (e) {
      console.warn("Azure OpenAI failed:", e);
    }
  }

  throw new Error(
    "AI 서비스 연결 실패. GITHUB_TOKEN(models 권한 필요) 또는 Azure OpenAI 환경변수를 확인해주세요."
  );
}

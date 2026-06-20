import { AnalyzeRequest, AnalyzeResponse } from "@/types";

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
  "revisedMessage": "더 안전하게 수정된 메시지 (위험할 경우에만)"
}`;

async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  userContent: string
): Promise<AnalyzeResponse> {
  const response = await fetch(`${endpoint}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
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
  const userContent = `
[대화 히스토리]
${request.conversationHistory || "(없음)"}

[보내려는 메시지]
${request.messageToSend}

위 메시지의 사회생활 위험도를 분석해주세요.`;

  // 1순위: GitHub Models API (Copilot SDK 호환 — PAT with models permission)
  if (githubToken) {
    try {
      return await callOpenAICompatible(
        "https://models.inference.ai.azure.com",
        githubToken,
        "gpt-4o",
        userContent
      );
    } catch (e) {
      console.warn("GitHub Models API failed, trying Azure OpenAI:", e);
    }
  }

  // 2순위: Azure OpenAI
  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";

  if (azureEndpoint && azureKey) {
    try {
      const response = await fetch(
        `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=2024-08-01-preview`,
        {
          method: "POST",
          headers: {
            "api-key": azureKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: userContent },
            ],
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

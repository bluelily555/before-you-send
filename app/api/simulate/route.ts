import { NextRequest, NextResponse } from "next/server";
import { SimulateRequest, SimulateResponse } from "@/types";

const SYSTEM_PROMPT = `당신은 직장 사회생활 대화 시뮬레이터 AI입니다.
사용자가 선택한 메시지를 보냈을 때 이후 대화가 어떻게 전개될지 현실적으로 시뮬레이션합니다.

규칙:
- 대화는 3~4턴 (내가 보낸 메시지 포함 총 5~7줄) 으로 시뮬레이션하세요.
- 상대방의 소통 방식과 감정 상태가 주어지면 그에 맞게 반응을 생성하세요.
- 각 상대방 턴에는 감정 상태(emotion)와 대응 팁(tip)을 포함하세요.
- 최종 결과(outcome)는 대화 흐름을 종합해 판단하세요.
- riskDelta: 음수면 갈등 감소(호전), 양수면 갈등 증가(악화), 범위 -100~100

반드시 아래 JSON 형식으로만 응답하세요:
{
  "turns": [
    { "speaker": "me", "message": "사용자가 보낸 메시지" },
    { "speaker": "opponent", "message": "상대방 반응", "emotion": "놀람/수용", "tip": "이 반응엔 ~하게 대응하세요" },
    { "speaker": "me", "message": "자연스러운 후속 발언" },
    { "speaker": "opponent", "message": "상대방 마무리 반응", "emotion": "수용", "tip": null }
  ],
  "outcome": "positive|neutral|negative",
  "outcomeLabel": "관계 개선|현상 유지|갈등 심화",
  "outcomeSummary": "이 메시지를 선택하면 어떻게 되는지 2~3문장 요약",
  "riskDelta": -20
}`;

export async function POST(req: NextRequest) {
  try {
    const body: SimulateRequest = await req.json();
    if (!body.selectedMessage?.trim()) {
      return NextResponse.json({ error: "메시지를 선택해주세요." }, { status: 400 });
    }

    const githubToken = req.headers.get("x-github-token") || process.env.GITHUB_TOKEN;

    const opponentSection = body.opponentContext
      ? `\n[상대방 프로필]\n- 소통방식: ${body.opponentContext.communicationStyle.label}형 (강도 ${body.opponentContext.communicationStyle.score})\n- 감정상태: ${body.opponentContext.emotionalState.label}\n- 주도권: ${body.opponentContext.powerDynamics.label} (${body.opponentContext.powerDynamics.score})\n- 패턴: ${body.opponentContext.patternTags.map(p => p.tag).join(", ")}`
      : "";

    const userContent = `[이전 대화 히스토리]\n${body.conversationHistory || "(없음)"}
${opponentSection}

[내가 선택한 메시지]\n${body.selectedMessage}

이 메시지를 보냈을 때 이후 대화가 어떻게 진행될지 시뮬레이션해주세요.`;

    const result = await callAI(userContent, githubToken);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "시뮬레이션 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function callAI(userContent: string, token?: string | null): Promise<SimulateResponse> {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];

  if (token) {
    const res = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "gpt-4o", messages, response_format: { type: "json_object" } }),
    });
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content) as SimulateResponse;
    }
  }

  const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const azureKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || "gpt-4o";
  if (azureEndpoint && azureKey) {
    const res = await fetch(
      `${azureEndpoint}/openai/deployments/${deployment}/chat/completions?api-version=2024-08-01-preview`,
      {
        method: "POST",
        headers: { "api-key": azureKey, "Content-Type": "application/json" },
        body: JSON.stringify({ messages, response_format: { type: "json_object" } }),
      }
    );
    if (res.ok) {
      const data = await res.json();
      return JSON.parse(data.choices[0].message.content) as SimulateResponse;
    }
  }

  throw new Error("AI 서비스 연결 실패");
}

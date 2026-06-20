/**
 * GitHub Copilot Extension 엔드포인트
 *
 * @copilot-extensions/preview-sdk를 사용해 Copilot Chat에서
 * "보내기 전에" 기능을 직접 호출할 수 있는 Extension API입니다.
 *
 * 사용 예 (GitHub Copilot Chat):
 *   @before-you-send 이 메시지 괜찮아? "팀장님 그건 아닌 것 같습니다"
 */

import { NextRequest } from "next/server";
import {
  verifyAndParseRequest,
  createAckEvent,
  createTextEvent,
  createDoneEvent,
  createErrorsEvent,
  getUserMessage,
} from "@copilot-extensions/preview-sdk";

const RISK_SYSTEM_PROMPT = `당신은 사회생활 소통 전문가 AI입니다.
사용자가 입력한 메시지의 직장/사회생활 위험도를 간결하게 분석하고,
더 안전한 3가지 톤(정중한/친근한/유머러스한)의 대안 메시지를 제안해주세요.
응답은 마크다운 형식으로 작성하세요.`;

export async function POST(req: NextRequest) {
  // 1) Copilot SDK: 요청 검증 및 파싱
  const body = await req.text();
  const signature = req.headers.get("github-public-key-signature") ?? "";
  const keyId = req.headers.get("github-public-key-identifier") ?? "";
  const tokenForUser = req.headers.get("x-github-token") ?? process.env.GITHUB_TOKEN ?? "";

  let payload;
  try {
    // verifyAndParseRequest: SDK 핵심 기능 — 서명 검증 + 페이로드 파싱
    const result = await verifyAndParseRequest(body, signature, keyId, {
      token: tokenForUser,
    });
    payload = result.payload;
  } catch {
    // 개발 환경 / 직접 호출 시 서명 검증 스킵
    try {
      payload = JSON.parse(body);
    } catch {
      return errorResponse("Invalid request body");
    }
  }

  // 2) SDK: 사용자 메시지 추출
  const userMessage = getUserMessage(payload) ?? "";
  if (!userMessage.trim()) {
    return errorResponse("메시지를 입력해주세요.");
  }

  // 3) SSE 스트리밍 응답 (Copilot SDK 이벤트 포맷)
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (chunk: string) => controller.enqueue(encoder.encode(chunk));

      try {
        // SDK: ACK 이벤트 먼저 전송 (응답 시작 알림)
        send(createAckEvent());

        // GitHub Models API 호출
        const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${tokenForUser}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              { role: "system", content: RISK_SYSTEM_PROMPT },
              { role: "user", content: `메시지 위험도 분석 요청:\n"${userMessage}"` },
            ],
            stream: true,
          }),
        });

        if (!response.ok || !response.body) {
          send(createTextEvent("⚠️ AI 서비스 연결에 실패했습니다. 잠시 후 다시 시도해주세요."));
        } else {
          // 스트리밍 응답을 SDK 텍스트 이벤트로 변환하여 전달
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ") || line === "data: [DONE]") continue;
              try {
                const json = JSON.parse(line.slice(6));
                const text = json.choices?.[0]?.delta?.content;
                if (text) {
                  // SDK: 텍스트 청크를 Copilot 호환 이벤트로 변환
                  send(createTextEvent(text));
                }
              } catch { /* 파싱 오류 무시 */ }
            }
          }
        }

        // SDK: 완료 이벤트
        send(createDoneEvent());
      } catch (err) {
        const message = err instanceof Error ? err.message : "오류가 발생했습니다.";
        // SDK: 오류 이벤트
        send(createErrorsEvent([{ type: "agent", code: "500", message, identifier: "analyze-error" }]));
        send(createDoneEvent());
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

function errorResponse(message: string) {
  const encoder = new TextEncoder();
  const body = createErrorsEvent([{ type: "agent", code: "400", message, identifier: "bad-request" }])
    + createDoneEvent();
  return new Response(encoder.encode(body), {
    status: 400,
    headers: { "Content-Type": "text/event-stream" },
  });
}

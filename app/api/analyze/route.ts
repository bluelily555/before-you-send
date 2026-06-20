import { NextRequest, NextResponse } from "next/server";
import { analyzeWithCopilot } from "@/lib/copilot";
import { AnalyzeRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json();

    if (!body.messageToSend?.trim()) {
      return NextResponse.json(
        { error: "보낼 메시지를 입력해주세요." },
        { status: 400 }
      );
    }

    // GitHub Copilot token from header (Copilot Extensions flow)
    const githubToken =
      req.headers.get("x-github-token") ||
      process.env.GITHUB_TOKEN ||
      undefined;

    const result = await analyzeWithCopilot(body, githubToken);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    const message =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { analyzeOpponent } from "@/lib/opponent";
import { OpponentAnalyzeRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: OpponentAnalyzeRequest = await req.json();

    if (!body.conversationHistory?.trim()) {
      return NextResponse.json(
        { error: "분석할 대화 히스토리를 입력해주세요." },
        { status: 400 }
      );
    }

    const githubToken =
      req.headers.get("x-github-token") ||
      process.env.GITHUB_TOKEN ||
      undefined;

    const result = await analyzeOpponent(body, githubToken);
    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "분석 중 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

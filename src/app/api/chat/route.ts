import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type ChatPolicyContext = {
  insurer?: string | null;
  planName?: string | null;
  policyType?: string;
  annualPremium?: string | null;
  sumAssured?: string | null;
  summary?: string;
  coverageHighlights?: string[];
  exclusions?: unknown[];
  gaps?: unknown[];
  waitingPeriods?: unknown[];
  redFlags?: unknown[];
  rawText?: string;
};

export async function POST(req: NextRequest) {
  const { messages, policyContext } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    policyContext?: ChatPolicyContext;
  };

  const rawText = (policyContext?.rawText ?? "").slice(0, 60_000);
  const summaryContext = {
    insurer: policyContext?.insurer,
    planName: policyContext?.planName,
    policyType: policyContext?.policyType,
    annualPremium: policyContext?.annualPremium,
    sumAssured: policyContext?.sumAssured,
    summary: policyContext?.summary,
    coverageHighlights: policyContext?.coverageHighlights,
    exclusions: policyContext?.exclusions,
    gaps: policyContext?.gaps,
    waitingPeriods: policyContext?.waitingPeriods,
    redFlags: policyContext?.redFlags,
  };

  const system = `You are PolicyLens Chat — a plain-English assistant answering questions about ONE specific Singapore insurance policy that the user has already uploaded.

Pre-analyzed structured summary:
${JSON.stringify(summaryContext, null, 2)}

Full raw policy text (may be partially garbled from PDF extraction — use judgment):
"""
${rawText}
"""

Rules:
- Ground every answer in either the structured summary or the raw policy text above. Prefer direct quotes with page/section references when the raw text shows them.
- If something is not in what you can see, say: "That's not covered in what I can see from this policy — check the original contract page by page or ask the insurer directly." Do not guess.
- Be blunt. No marketing fluff.
- Quote exact numbers and clause names when you can.
- If the user asks "should I keep this", give a reasoned yes/no, not a dodge.
- Keep answers tight — 1-4 short paragraphs unless the question explicitly asks for detail.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages,
    maxTokens: 1500,
    temperature: 0.3,
  });

  return result.toDataStreamResponse();
}

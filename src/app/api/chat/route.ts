import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { messages, policyContext } = await req.json();

  const system = `You are PolicyLens Chat — a plain-English assistant answering questions about ONE specific Singapore insurance policy that the user has already uploaded.

Policy context (pre-analyzed):
${JSON.stringify(policyContext ?? {}, null, 2)}

Rules:
- Only answer from the policy context. If something isn't in the context, say "That's not covered in what I can see from this policy — check the original contract page by page or ask the insurer directly."
- Be blunt. No marketing fluff.
- Quote exact numbers and clause names when you can.
- If the user asks "should I keep this", give a reasoned yes/no, not a dodge.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system,
    messages,
  });

  return result.toDataStreamResponse();
}

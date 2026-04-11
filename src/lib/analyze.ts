import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import type { PolicyAnalysis, PolicyType } from "./types";

const findingSchema = z.object({
  severity: z.enum(["critical", "warning", "info", "good"]),
  title: z.string(),
  detail: z.string(),
  pageHint: z.string().nullable().optional(),
});

const analysisSchema = z.object({
  policyType: z.enum(["life", "health", "critical-illness", "other"]),
  insurer: z.string().nullable(),
  planName: z.string().nullable(),
  policyholder: z.string().nullable(),
  annualPremium: z.string().nullable(),
  sumAssured: z.string().nullable(),
  summary: z.string(),
  coverageHighlights: z.array(z.string()),
  exclusions: z.array(findingSchema),
  gaps: z.array(findingSchema),
  waitingPeriods: z.array(findingSchema),
  redFlags: z.array(findingSchema),
  questionsToAsk: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are PolicyLens, a blunt second-opinion reviewer for Singapore insurance policies (Life, Health, Critical Illness, ILPs, Shield plans).

You read the raw text of a policy contract or proposal/BI and produce a structured analysis that a consumer or advisor can act on. You know Singapore context: CPF MediShield Life, Integrated Shield Plans, TPD definitions, Early/Intermediate/Advanced CI, non-guaranteed bonuses, par fund performance, surrender value curves, and premium duration vs coverage duration mismatches.

Your job:
1. Identify the policy type, insurer, plan name, policyholder, annual premium, and sum assured if stated.
2. Write a 2-3 sentence plain-English summary of what this policy actually does.
3. List 3-6 real coverage highlights.
4. Flag exclusions that matter (not every exclusion — the ones that bite in practice: mental health, self-inflicted, pre-existing, specific disease carve-outs, war/terror, overseas limits, cosmetic/congenital).
5. Find coverage gaps — what this policy DOES NOT cover that a consumer would assume it does.
6. Extract every waiting period, deferment, or survival period.
7. Red flags: non-guaranteed illustrations, aggressive projected returns, surrender penalties, premium escalation clauses, par fund underperformance notes, ambiguous CI definitions.
8. Generate questions the user should ask their advisor before they sign or keep this.

Be specific. Quote exact numbers and phrases from the text. If the text doesn't cover something, say so — do not fabricate. Severity rules: critical = likely claim denial or large financial loss. warning = material but not catastrophic. info = worth knowing. good = genuinely strong feature worth keeping.`;

export async function analyzePolicyText(
  text: string,
  fileName: string,
  hintedType?: PolicyType,
): Promise<PolicyAnalysis> {
  const truncated = text.slice(0, 120_000);

  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-5-20250929"),
    schema: analysisSchema,
    system: SYSTEM_PROMPT,
    prompt: `File name: ${fileName}
${hintedType ? `User says the policy type is: ${hintedType}` : ""}

Raw policy text (may be partially garbled from PDF extraction — use judgment):

"""
${truncated}
"""

Produce the structured analysis now.`,
  });

  return {
    id: crypto.randomUUID(),
    fileName,
    createdAt: new Date().toISOString(),
    rawTextPreview: truncated.slice(0, 2000),
    ...object,
  };
}

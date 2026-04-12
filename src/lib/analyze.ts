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

const coreSchema = z.object({
  policyType: z.enum(["life", "health", "critical-illness", "other"]),
  insurer: z.string().nullable(),
  planName: z.string().nullable(),
  policyholder: z.string().nullable(),
  annualPremium: z.string().nullable(),
  sumAssured: z.string().nullable(),
  summary: z.string(),
  coverageHighlights: z.array(z.string()),
  questionsToAsk: z.array(z.string()),
});

const findingsSchema = z.object({
  exclusions: z.array(findingSchema),
  gaps: z.array(findingSchema),
  waitingPeriods: z.array(findingSchema),
  redFlags: z.array(findingSchema),
});

const BASE_CONTEXT = `You are PolicyLens, a blunt second-opinion reviewer for Singapore insurance policies (Life, Health, Critical Illness, ILPs, Shield plans). You know Singapore context: CPF MediShield Life, Integrated Shield Plans, TPD definitions, Early/Intermediate/Advanced CI, non-guaranteed bonuses, par fund performance, surrender value curves, and premium duration vs coverage duration mismatches.

Be specific. Quote exact numbers and phrases. Do not fabricate — if the text does not cover something, say so.`;

const CORE_PROMPT = `${BASE_CONTEXT}

Your job on this pass:
1. Identify policy type, insurer, plan name, policyholder, annual premium, sum assured.
2. Write a 2-3 sentence plain-English summary of what this policy actually does.
3. List 3-6 real coverage highlights.
4. Generate 4-6 questions the user should ask their advisor before they sign or keep this.`;

const FINDINGS_PROMPT = `${BASE_CONTEXT}

Your job on this pass is to find four kinds of issues:

1. EXCLUSIONS that bite in practice — not every exclusion, just the ones that matter: mental health, self-inflicted, pre-existing, specific disease carve-outs, war/terror, overseas limits, cosmetic/congenital.

2. COVERAGE GAPS — what this policy DOES NOT cover that a consumer would assume it does (income replacement, hospitalization, life insurance if it's a CI plan, early-stage CI if it's an advanced-only plan, etc).

3. WAITING PERIODS — every waiting period, deferment period, survival period. Extract all of them.

4. RED FLAGS — non-guaranteed illustrations, aggressive projected returns, surrender penalties, premium escalation clauses, par fund underperformance notes, ambiguous CI definitions, aggregate per-life caps.

Severity rules: critical = likely claim denial or large financial loss. warning = material but not catastrophic. info = worth knowing. good = genuinely strong feature.`;

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("generation failed");
}

export async function analyzePolicyText(
  text: string,
  fileName: string,
  hintedType?: PolicyType,
): Promise<PolicyAnalysis> {
  const truncated = text.slice(0, 60_000);

  const userPrompt = `File name: ${fileName}
${hintedType ? `User says the policy type is: ${hintedType}` : ""}

Raw policy text (may be partially garbled from PDF extraction — use judgment):

"""
${truncated}
"""`;

  const [core, findings] = await Promise.all([
    withRetry(() =>
      generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: coreSchema,
        system: CORE_PROMPT,
        prompt: userPrompt,
        maxTokens: 3000,
        temperature: 0.2,
      }).then((r) => r.object),
    ),
    withRetry(() =>
      generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: findingsSchema,
        system: FINDINGS_PROMPT,
        prompt: userPrompt,
        maxTokens: 6000,
        temperature: 0.2,
      }).then((r) => r.object),
    ),
  ]);

  return {
    id: crypto.randomUUID(),
    fileName,
    createdAt: new Date().toISOString(),
    rawTextPreview: truncated,
    ...core,
    ...findings,
  };
}

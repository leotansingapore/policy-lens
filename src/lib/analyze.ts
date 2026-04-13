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

const SYSTEM_PROMPT = `You are PolicyLens, a blunt second-opinion reviewer for Singapore insurance policies (Life, Health, Critical Illness, ILPs, Shield plans). You know Singapore context: CPF MediShield Life, Integrated Shield Plans, TPD definitions, Early/Intermediate/Advanced CI, non-guaranteed bonuses, par fund performance, surrender value curves, premium duration vs coverage duration mismatches.

Produce a structured analysis with:
1. Identify policy type, insurer, plan name, policyholder, annual premium, sum assured.
2. 2-3 sentence plain-English summary.
3. 3-6 real coverage highlights.
4. Exclusions that bite in practice (not every exclusion — just the ones that matter: mental health, self-inflicted, pre-existing, specific disease carve-outs, war/terror, overseas limits, cosmetic/congenital).
5. Coverage gaps — what this policy DOES NOT cover that a consumer would assume it does (income replacement, hospitalization, life insurance if it's a CI plan, early-stage CI if it's advanced-only, etc.).
6. Every waiting period, deferment, or survival period.
7. Red flags — non-guaranteed illustrations, aggressive projected returns, surrender penalties, premium escalation, ambiguous CI definitions, aggregate per-life caps.
8. 4-6 questions the user should ask their advisor.

Rules:
- Be specific. Quote exact numbers and phrases.
- Do not fabricate — if the text doesn't cover something, say so.
- Keep each finding detail under 60 words.
- Severity: critical = likely claim denial or large financial loss. warning = material but not catastrophic. info = worth knowing. good = genuinely strong feature.
- Aim for 3-8 items per findings array. More is not better.`;

async function runAnalysis(
  userContent: Array<
    | { type: "text"; text: string }
    | { type: "file"; data: Buffer; mimeType: string }
  >,
): Promise<z.infer<typeof analysisSchema>> {
  let lastErr: unknown = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await generateObject({
        model: anthropic("claude-sonnet-4-6"),
        schema: analysisSchema,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
        maxTokens: 6000,
        temperature: 0.2,
      });
      return res.object;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr ?? new Error("analysis failed");
}

export async function analyzePolicyText(
  text: string,
  fileName: string,
  hintedType?: PolicyType,
): Promise<PolicyAnalysis> {
  const truncated = text.slice(0, 60_000);

  const prompt = `File name: ${fileName}
${hintedType ? `User says the policy type is: ${hintedType}` : ""}

Raw policy text (may be partially garbled from PDF extraction — use judgment):

"""
${truncated}
"""

Produce the structured analysis now.`;

  const object = await runAnalysis([{ type: "text", text: prompt }]);

  return {
    id: crypto.randomUUID(),
    fileName,
    createdAt: new Date().toISOString(),
    rawTextPreview: truncated,
    ...object,
  };
}

/**
 * Fallback for scanned/watermark-only PDFs: hands the raw PDF to Claude,
 * which OCRs the document natively and produces the structured analysis.
 */
export async function analyzePolicyPdf(
  pdf: Buffer,
  fileName: string,
  hintedType?: PolicyType,
): Promise<PolicyAnalysis> {
  const prompt = `File name: ${fileName}
${hintedType ? `User says the policy type is: ${hintedType}` : ""}

The attached PDF could not be parsed by a text extractor (likely a scanned image or watermark-only layer). Read the document yourself — OCR the pages, ignore repeated watermark stamps such as "FSC COPY" or "SPECIMEN", and extract real policy content.

If after OCR the document genuinely contains no policy content, return an analysis where summary explains that and findings are empty arrays (not fabricated).

Produce the structured analysis now.`;

  const object = await runAnalysis([
    { type: "file", data: pdf, mimeType: "application/pdf" },
    { type: "text", text: prompt },
  ]);

  return {
    id: crypto.randomUUID(),
    fileName,
    createdAt: new Date().toISOString(),
    rawTextPreview: "(OCR fallback — no plain-text layer available)",
    ...object,
  };
}

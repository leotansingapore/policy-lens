import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;
export const dynamic = "force-dynamic";

const riskLevelSchema = z.enum(["low", "medium", "high"]);

const insightsSchema = z.object({
  summary: z.string(),
  riskProjection: z.array(
    z.object({
      category: z.string(),
      now: z.object({ level: riskLevelSchema, reason: z.string() }),
      fiveYear: z.object({ level: riskLevelSchema, reason: z.string() }),
      tenYear: z.object({ level: riskLevelSchema, reason: z.string() }),
    }),
  ),
  recommendations: z.array(z.string()),
  tips: z.array(z.string()),
});

const SYSTEM_PROMPT = `You are PolicyLens, a personalized insurance gap analyst for Singapore consumers. Given a policy analysis and the user's personal context, produce a personalized risk assessment.

Rules:
- Risk projection must have exactly 3 rows: "Health Deterioration Risk", "Income Protection Gap", "Dependant Vulnerability".
- Each row has now / +5yr / +10yr with level (low/medium/high) and a 1-sentence reason tied to the user's actual numbers.
- Recommendations: 3-5 specific product types to consider (e.g. "Term life insurance with $X coverage" where X is derived from their income). Use their income and dependents to calculate suggested coverage amounts.
- Tips: 3 actionable tips specific to their situation.
- Summary: 2-3 sentences synthesizing gaps + user context into a personalized assessment.
- Be blunt and specific. Use their actual age, income, and dependent count in your reasoning.
- Singapore context: CPF provides basic life coverage (~$46k for CPFIS members), MediShield Life covers Class B2/C wards, consider HDB loan coverage needs.`;

export async function POST(req: NextRequest) {
  try {
    const { userContext, policyAnalysis } = await req.json();

    if (!userContext?.age || !policyAnalysis) {
      return NextResponse.json(
        { error: "Missing user context or policy analysis" },
        { status: 400 },
      );
    }

    const prompt = `User context:
- Age: ${userContext.age}
- Monthly income: S$${userContext.monthlyIncome?.toLocaleString() ?? "not provided"}
- Number of dependents: ${userContext.dependents ?? 0}
- Existing coverage (besides this policy): ${userContext.existingCoverage || "None mentioned"}

Policy being analyzed:
- Plan: ${policyAnalysis.planName ?? policyAnalysis.fileName}
- Insurer: ${policyAnalysis.insurer ?? "Unknown"}
- Type: ${policyAnalysis.policyType}
- Sum assured: ${policyAnalysis.sumAssured ?? "Not stated"}
- Annual premium: ${policyAnalysis.annualPremium ?? "Not stated"}
- Summary: ${policyAnalysis.summary}

Coverage gaps already identified:
${(policyAnalysis.gaps ?? []).map((g: { title: string; detail: string }) => `- ${g.title}: ${g.detail}`).join("\n")}

Red flags:
${(policyAnalysis.redFlags ?? []).map((f: { title: string; detail: string }) => `- ${f.title}: ${f.detail}`).join("\n")}

Generate personalized risk projection, recommendations, and tips.`;

    const { object } = await generateObject({
      model: anthropic("claude-sonnet-4-6"),
      schema: insightsSchema,
      system: SYSTEM_PROMPT,
      prompt,
      maxTokens: 3000,
      temperature: 0.3,
    });

    return NextResponse.json(object);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("personalize error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

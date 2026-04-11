import { NextRequest, NextResponse } from "next/server";
import { analyzePolicyText } from "@/lib/analyze";
import type { PolicyType } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const hintedType = form.get("policyType") as PolicyType | null;

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File exceeds 50MB" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const pdfParseMod = await import("pdf-parse");
    const pdfParse = (pdfParseMod as unknown as { default: (b: Buffer) => Promise<{ text: string }> }).default;
    const parsed = await pdfParse(buffer);

    if (!parsed.text || parsed.text.trim().length < 200) {
      return NextResponse.json(
        {
          error:
            "Could not extract enough text from this PDF. It may be a scanned image — try a text-based PDF export.",
        },
        { status: 422 },
      );
    }

    const analysis = await analyzePolicyText(parsed.text, file.name, hintedType ?? undefined);
    return NextResponse.json(analysis);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze error", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

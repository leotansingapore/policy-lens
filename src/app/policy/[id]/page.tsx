"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPolicy } from "@/lib/storage";
import type { Finding, PolicyAnalysis } from "@/lib/types";
import { AlertTriangle, CheckCircle2, Info, ShieldAlert, ArrowLeft } from "lucide-react";
import { PolicyChat } from "@/components/policy-chat";

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<PolicyAnalysis | null | undefined>(undefined);

  useEffect(() => {
    setPolicy(getPolicy(params.id));
  }, [params.id]);

  if (policy === undefined) {
    return <main className="max-w-5xl mx-auto p-10 text-[#71717a]">Loading…</main>;
  }
  if (policy === null) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-14">
        <Link href="/portfolio" className="btn btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="card p-10 text-center">
          <h2 className="font-semibold mb-1">Policy not found</h2>
          <p className="text-sm text-[#a1a1aa]">
            This link only works in the browser where you analyzed the policy.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Link href="/portfolio" className="btn btn-ghost mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to portfolio
      </Link>

      <header className="mb-8">
        <div className="text-xs uppercase tracking-wide text-[#71717a] mb-2">
          {policy.policyType}
        </div>
        <h1 className="text-3xl font-semibold mb-1">
          {policy.planName ?? policy.fileName}
        </h1>
        <div className="text-[#a1a1aa]">{policy.insurer ?? "Unknown insurer"}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          {policy.policyholder && (
            <span className="chip">Policyholder: {policy.policyholder}</span>
          )}
          {policy.annualPremium && (
            <span className="chip">Premium: {policy.annualPremium}</span>
          )}
          {policy.sumAssured && <span className="chip">Sum assured: {policy.sumAssured}</span>}
        </div>
      </header>

      <section className="card p-6 mb-6">
        <h2 className="font-semibold mb-2">Plain-English summary</h2>
        <p className="text-[#d4d4d8] leading-relaxed">{policy.summary}</p>
      </section>

      {policy.coverageHighlights?.length > 0 && (
        <section className="card p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> Coverage highlights
          </h2>
          <ul className="space-y-2">
            {policy.coverageHighlights.map((h, i) => (
              <li key={i} className="text-sm text-[#d4d4d8] flex gap-2">
                <span className="text-[#22c55e]">•</span>
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      <FindingsSection
        title="Red flags"
        icon={<ShieldAlert className="w-4 h-4 text-[#ef4444]" />}
        findings={policy.redFlags}
      />
      <FindingsSection
        title="Exclusions that matter"
        icon={<AlertTriangle className="w-4 h-4 text-[#f5a524]" />}
        findings={policy.exclusions}
      />
      <FindingsSection
        title="Coverage gaps"
        icon={<AlertTriangle className="w-4 h-4 text-[#f5a524]" />}
        findings={policy.gaps}
      />
      <FindingsSection
        title="Waiting periods"
        icon={<Info className="w-4 h-4 text-[#7c5cff]" />}
        findings={policy.waitingPeriods}
      />

      {policy.questionsToAsk?.length > 0 && (
        <section className="card p-6 mb-6">
          <h2 className="font-semibold mb-3">Questions to ask your advisor</h2>
          <ol className="space-y-2 list-decimal list-inside text-sm text-[#d4d4d8]">
            {policy.questionsToAsk.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
        </section>
      )}

      <PolicyChat policy={policy} />
    </main>
  );
}

function FindingsSection({
  title,
  icon,
  findings,
}: {
  title: string;
  icon: React.ReactNode;
  findings?: Finding[];
}) {
  if (!findings || findings.length === 0) return null;
  return (
    <section className="card p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">
        {findings.map((f, i) => (
          <div key={i} className="border-l-2 pl-4 py-1" style={{ borderColor: severityColor(f.severity) }}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`chip ${severityChip(f.severity)}`}>{f.severity}</span>
              <span className="font-medium text-sm">{f.title}</span>
            </div>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">{f.detail}</p>
            {f.pageHint && (
              <p className="text-xs text-[#71717a] mt-1">Reference: {f.pageHint}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function severityColor(s: Finding["severity"]) {
  return s === "critical"
    ? "#ef4444"
    : s === "warning"
      ? "#f5a524"
      : s === "good"
        ? "#22c55e"
        : "#7c5cff";
}
function severityChip(s: Finding["severity"]) {
  return s === "critical"
    ? "chip-danger"
    : s === "warning"
      ? "chip-warn"
      : s === "good"
        ? "chip-ok"
        : "chip-info";
}

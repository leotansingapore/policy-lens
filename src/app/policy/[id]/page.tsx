"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPolicy } from "@/lib/storage";
import type { Finding, PolicyAnalysis } from "@/lib/types";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
  ArrowLeft,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { PolicyChat } from "@/components/policy-chat";

type Tab = "fine-print" | "gap-finder";

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<PolicyAnalysis | null | undefined>(
    undefined,
  );
  const [tab, setTab] = useState<Tab>("fine-print");

  useEffect(() => {
    setPolicy(getPolicy(params.id));
  }, [params.id]);

  if (policy === undefined) return <ReportSkeleton />;
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

  const gapCount = policy.gaps?.length ?? 0;
  const flagCount =
    (policy.redFlags?.length ?? 0) +
    (policy.exclusions?.length ?? 0) +
    (policy.waitingPeriods?.length ?? 0);

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <Link href="/portfolio" className="btn btn-ghost mb-5 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to portfolio
      </Link>

      <header className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[#71717a] mb-2">
          {policy.policyType}
        </div>
        <h1 className="text-3xl font-semibold mb-1">
          {policy.planName ?? policy.fileName}
        </h1>
        <div className="text-[#a1a1aa]">
          {policy.insurer ?? "Unknown insurer"}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {policy.policyholder && (
            <span className="chip">Policyholder: {policy.policyholder}</span>
          )}
          {policy.annualPremium && (
            <span className="chip">Premium: {policy.annualPremium}</span>
          )}
          {policy.sumAssured && (
            <span className="chip">Sum assured: {policy.sumAssured}</span>
          )}
        </div>
      </header>

      {/* Summary quote block */}
      <section className="mb-8 border-l-4 border-[#7c5cff] pl-5 py-3">
        <p className="text-lg text-[#d4d4d8] leading-relaxed italic">
          &ldquo;{policy.summary}&rdquo;
        </p>
      </section>

      <div className="flex gap-2 mb-6 border-b border-[#1f1f24]">
        <TabButton
          active={tab === "fine-print"}
          onClick={() => setTab("fine-print")}
          icon={<FileText className="w-4 h-4" />}
          label="Fine Print Decoder"
          count={flagCount}
        />
        <TabButton
          active={tab === "gap-finder"}
          onClick={() => setTab("gap-finder")}
          icon={<Search className="w-4 h-4" />}
          label="Coverage Gap Finder"
          count={gapCount}
        />
      </div>

      {tab === "fine-print" && (
        <>
          {policy.coverageHighlights?.length > 0 && (
            <section className="card p-6 mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> Coverage
                highlights
              </h2>
              <ul className="space-y-2">
                {policy.coverageHighlights.map((h, i) => (
                  <li key={i} className="text-sm text-[#d4d4d8] flex gap-2">
                    <span className="text-[#22c55e] mt-0.5 shrink-0">
                      &#x2713;
                    </span>
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
            title="Waiting periods"
            icon={<Info className="w-4 h-4 text-[#7c5cff]" />}
            findings={policy.waitingPeriods}
          />
        </>
      )}

      {tab === "gap-finder" && (
        <>
          <section className="card p-6 mb-6">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-[#7c5cff]" /> What this policy
              doesn&apos;t cover
            </h2>
            <p className="text-sm text-[#a1a1aa] leading-relaxed">
              Most consumers assume their policy is broader than it is. These
              are the protections this plan leaves on the table — things you may
              need to cover with a separate product.
            </p>
          </section>

          {gapCount === 0 ? (
            <section className="card p-6 mb-6 text-sm text-[#a1a1aa]">
              No material coverage gaps were detected on this policy.
            </section>
          ) : (
            <FindingsSection
              title={`${gapCount} coverage gap${gapCount === 1 ? "" : "s"} found`}
              icon={<AlertTriangle className="w-4 h-4 text-[#f5a524]" />}
              findings={policy.gaps}
              alwaysShowHeader
            />
          )}

          {policy.questionsToAsk?.length > 0 && (
            <section className="card p-6 mb-6">
              <h2 className="font-semibold mb-3">
                Questions to ask your advisor
              </h2>
              <ol className="space-y-2 list-decimal list-inside text-sm text-[#d4d4d8]">
                {policy.questionsToAsk.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}

      <PolicyChat policy={policy} />

      <footer className="mt-6 mb-2 text-center text-xs text-[#71717a]">
        This is not financial advice. Consult a licensed financial advisor before
        making policy changes.
      </footer>
    </main>
  );
}

/* ---------- Skeleton ---------- */
function ReportSkeleton() {
  return (
    <main className="max-w-5xl mx-auto px-6 py-10 animate-pulse">
      <div className="h-4 w-28 bg-[#1f1f24] rounded mb-6" />
      <div className="h-3 w-20 bg-[#1f1f24] rounded mb-3" />
      <div className="h-8 w-80 bg-[#1f1f24] rounded mb-2" />
      <div className="h-4 w-48 bg-[#1f1f24] rounded mb-6" />
      <div className="border-l-4 border-[#1f1f24] pl-5 py-3 mb-8">
        <div className="h-5 w-full bg-[#1f1f24] rounded mb-2" />
        <div className="h-5 w-3/4 bg-[#1f1f24] rounded" />
      </div>
      <div className="flex gap-4 mb-6 border-b border-[#1f1f24] pb-2">
        <div className="h-4 w-36 bg-[#1f1f24] rounded" />
        <div className="h-4 w-36 bg-[#1f1f24] rounded" />
      </div>
      {[1, 2, 3].map((n) => (
        <div key={n} className="card p-6 mb-6">
          <div className="h-5 w-40 bg-[#1f1f24] rounded mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((j) => (
              <div key={j} className="border-l-2 border-[#1f1f24] pl-4 py-1">
                <div className="h-4 w-56 bg-[#1f1f24] rounded mb-2" />
                <div className="h-3 w-full bg-[#1f1f24] rounded" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </main>
  );
}

/* ---------- Tab button ---------- */
function TabButton({
  active,
  onClick,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition -mb-px ${
        active
          ? "border-[#7c5cff] text-white"
          : "border-transparent text-[#71717a] hover:text-[#d4d4d8]"
      }`}
    >
      {icon}
      {label}
      {count > 0 && (
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            active
              ? "bg-[#7c5cff]/20 text-[#c4b5fd]"
              : "bg-[#1f1f24] text-[#71717a]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ---------- Finding card ---------- */
function FindingCard({ finding }: { finding: Finding }) {
  const [open, setOpen] = useState(false);
  const isLong = finding.detail.length > 120;
  const showDetail = open || !isLong;

  return (
    <div
      className="border-l-2 pl-4 py-2 cursor-pointer group"
      style={{ borderColor: severityColor(finding.severity) }}
      onClick={() => isLong && setOpen(!open)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`chip ${severityChip(finding.severity)}`}>
          {finding.severity}
        </span>
        <span className="font-medium text-sm flex-1">{finding.title}</span>
        {isLong && (
          <span className="text-[#71717a] opacity-0 group-hover:opacity-100 transition">
            {open ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </span>
        )}
      </div>
      <p
        className={`text-sm text-[#a1a1aa] leading-relaxed transition-all ${
          !showDetail ? "line-clamp-2" : ""
        }`}
      >
        {finding.detail}
      </p>
      {finding.pageHint && (
        <p className="text-xs text-[#71717a] mt-1">
          Reference: {finding.pageHint}
        </p>
      )}
    </div>
  );
}

/* ---------- Findings section ---------- */
function FindingsSection({
  title,
  icon,
  findings,
  alwaysShowHeader = false,
}: {
  title: string;
  icon: React.ReactNode;
  findings?: Finding[];
  alwaysShowHeader?: boolean;
}) {
  if (!alwaysShowHeader && (!findings || findings.length === 0)) return null;
  return (
    <section className="card p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">
        {findings?.map((f, i) => (
          <FindingCard key={i} finding={f} />
        ))}
      </div>
    </section>
  );
}

/* ---------- Severity helpers ---------- */
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

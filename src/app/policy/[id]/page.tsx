"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPolicy } from "@/lib/storage";
import type { Finding, PolicyAnalysis, UserContext, PersonalizedInsights } from "@/lib/types";
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
  UserCircle,
  MessageSquare,
} from "lucide-react";
import { PolicyChat } from "@/components/policy-chat";
import { ContextModal, loadUserContext } from "@/components/context-modal";
import { RiskProjection } from "@/components/risk-projection";

type Tab = "fine-print" | "gap-finder";

export default function PolicyDetailPage() {
  const params = useParams<{ id: string }>();
  const [policy, setPolicy] = useState<PolicyAnalysis | null | undefined>(undefined);
  const [tab, setTab] = useState<Tab>("fine-print");
  const [contextOpen, setContextOpen] = useState(false);
  const [insights, setInsights] = useState<PersonalizedInsights | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [userCtx, setUserCtx] = useState<UserContext | null>(null);
  const [chatQuestion, setChatQuestion] = useState<string | null>(null);

  useEffect(() => {
    const p = getPolicy(params.id);
    setPolicy(p);
    setUserCtx(loadUserContext());
  }, [params.id]);

  const generateInsights = useCallback(
    async (ctx: UserContext) => {
      if (!policy) return;
      setInsightsLoading(true);
      setContextOpen(false);
      setTab("gap-finder");
      try {
        const res = await fetch("/api/personalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userContext: ctx, policyAnalysis: policy }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to generate insights");
        setInsights(data as PersonalizedInsights);
        setUserCtx(ctx);
      } catch (e) {
        console.error(e);
      } finally {
        setInsightsLoading(false);
      }
    },
    [policy],
  );

  useEffect(() => {
    const saved = loadUserContext();
    if (saved && !insights && policy && !insightsLoading) {
      generateInsights(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policy]);

  function askAboutFinding(f: Finding) {
    setChatQuestion(`Tell me more about "${f.title}" — what does this mean for me in practice?`);
  }

  if (policy === undefined) return <ReportSkeleton />;
  if (policy === null) {
    return (
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14">
        <Link href="/portfolio" className="btn btn-ghost mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <div className="card p-10 text-center">
          <h2 className="font-semibold mb-1">Policy not found</h2>
          <p className="text-sm text-[hsl(var(--text-secondary))]">
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
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-5 gap-2">
        <Link href="/portfolio" className="btn btn-ghost text-sm shrink-0">
          <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Back to portfolio</span><span className="sm:hidden">Back</span>
        </Link>
        <button
          onClick={() => setContextOpen(true)}
          className="btn btn-ghost text-sm shrink-0"
        >
          <UserCircle className="w-4 h-4" />
          <span className="hidden sm:inline">{userCtx ? `Age ${userCtx.age}` : "Update context"}</span>
        </button>
      </div>

      <header className="mb-6">
        <div className="text-xs uppercase tracking-wide text-[hsl(var(--text-muted))] mb-2">
          {policy.policyType}
        </div>
        <h1 className="text-2xl sm:text-3xl font-semibold mb-1 break-words">
          {policy.planName ?? policy.fileName}
        </h1>
        <div className="text-[hsl(var(--text-secondary))]">{policy.insurer ?? "Unknown insurer"}</div>
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

      <section className="mb-8 border-l-4 border-[hsl(var(--accent))] pl-4 sm:pl-5 py-3">
        <p className="text-base sm:text-lg text-[hsl(var(--text))] leading-relaxed italic">
          &ldquo;{policy.summary}&rdquo;
        </p>
      </section>

      <div className="flex gap-1 sm:gap-2 mb-6 border-b border-[hsl(var(--border))] overflow-x-auto">
        <TabButton
          active={tab === "fine-print"}
          onClick={() => setTab("fine-print")}
          icon={<FileText className="w-4 h-4" />}
          label="Fine Print Decoder"
          shortLabel="Fine Print"
          count={flagCount}
        />
        <TabButton
          active={tab === "gap-finder"}
          onClick={() => setTab("gap-finder")}
          icon={<Search className="w-4 h-4" />}
          label="Coverage Gap Finder"
          shortLabel="Gap Finder"
          count={gapCount}
        />
      </div>

      {tab === "fine-print" && (
        <>
          {policy.coverageHighlights?.length > 0 && (
            <section className="card p-4 sm:p-6 mb-6">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> Coverage highlights
              </h2>
              <ul className="space-y-2">
                {policy.coverageHighlights.map((h, i) => (
                  <li key={i} className="text-sm text-[hsl(var(--text))] flex gap-2">
                    <span className="text-[#22c55e] mt-0.5 shrink-0">&#x2713;</span>
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
            onAsk={askAboutFinding}
          />
          <FindingsSection
            title="Exclusions that matter"
            icon={<AlertTriangle className="w-4 h-4 text-[#f5a524]" />}
            findings={policy.exclusions}
            onAsk={askAboutFinding}
          />
          <FindingsSection
            title="Waiting periods"
            icon={<Info className="w-4 h-4 text-[hsl(var(--accent))]" />}
            findings={policy.waitingPeriods}
            onAsk={askAboutFinding}
          />
        </>
      )}

      {tab === "gap-finder" && (
        <>
          <section className="card p-4 sm:p-6 mb-6">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Search className="w-4 h-4 text-[hsl(var(--accent))]" /> What this policy
              doesn&apos;t cover
            </h2>
            <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
              Most consumers assume their policy is broader than it is. These are the
              protections this plan leaves on the table.
            </p>
          </section>

          {gapCount === 0 ? (
            <section className="card p-4 sm:p-6 mb-6 text-sm text-[hsl(var(--text-secondary))]">
              No material coverage gaps were detected on this policy.
            </section>
          ) : (
            <FindingsSection
              title={`${gapCount} coverage gap${gapCount === 1 ? "" : "s"} found`}
              icon={<AlertTriangle className="w-4 h-4 text-[#f5a524]" />}
              findings={policy.gaps}
              onAsk={askAboutFinding}
              alwaysShowHeader
            />
          )}

          {policy.questionsToAsk?.length > 0 && (
            <section className="card p-4 sm:p-6 mb-6">
              <h2 className="font-semibold mb-3">Questions to ask your advisor</h2>
              <ol className="space-y-2 list-decimal list-inside text-sm text-[hsl(var(--text))]">
                {policy.questionsToAsk.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ol>
            </section>
          )}

          {insightsLoading && (
            <section className="card p-4 sm:p-6 mb-6 animate-pulse">
              <div className="h-5 w-48 bg-[hsl(var(--border))] rounded mb-4" />
              <div className="space-y-3">
                <div className="h-4 w-full bg-[hsl(var(--border))] rounded" />
                <div className="h-4 w-3/4 bg-[hsl(var(--border))] rounded" />
                <div className="h-20 w-full bg-[hsl(var(--border))] rounded" />
              </div>
            </section>
          )}

          {insights && !insightsLoading && <RiskProjection insights={insights} />}

          {!insights && !insightsLoading && (
            <section className="card p-4 sm:p-6 mb-6 text-center">
              <p className="text-sm text-[hsl(var(--text-secondary))] mb-3">
                Add your age, income, and dependents for a personalized 10-year
                risk projection and coverage recommendations.
              </p>
              <button
                onClick={() => setContextOpen(true)}
                className="btn btn-primary text-sm"
              >
                <UserCircle className="w-4 h-4" /> Personalize analysis
              </button>
            </section>
          )}
        </>
      )}

      <PolicyChat
        policy={policy}
        pendingQuestion={chatQuestion}
        onQuestionConsumed={() => setChatQuestion(null)}
      />

      <footer className="mt-6 mb-2 text-center text-xs text-[hsl(var(--text-muted))]">
        This is not financial advice. Consult a licensed financial advisor before
        making policy changes.
      </footer>

      <ContextModal
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        onSave={generateInsights}
        loading={insightsLoading}
      />
    </main>
  );
}

/* ---------- Skeleton ---------- */
function ReportSkeleton() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
      <div className="h-4 w-28 bg-[hsl(var(--border))] rounded mb-6" />
      <div className="h-3 w-20 bg-[hsl(var(--border))] rounded mb-3" />
      <div className="h-8 w-3/4 sm:w-80 bg-[hsl(var(--border))] rounded mb-2" />
      <div className="h-4 w-48 bg-[hsl(var(--border))] rounded mb-6" />
      <div className="border-l-4 border-[hsl(var(--border))] pl-5 py-3 mb-8">
        <div className="h-5 w-full bg-[hsl(var(--border))] rounded mb-2" />
        <div className="h-5 w-3/4 bg-[hsl(var(--border))] rounded" />
      </div>
      {[1, 2, 3].map((n) => (
        <div key={n} className="card p-4 sm:p-6 mb-6">
          <div className="h-5 w-40 bg-[hsl(var(--border))] rounded mb-4" />
          <div className="space-y-3">
            {[1, 2].map((j) => (
              <div key={j} className="border-l-2 border-[hsl(var(--border))] pl-4 py-1">
                <div className="h-4 w-56 bg-[hsl(var(--border))] rounded mb-2" />
                <div className="h-3 w-full bg-[hsl(var(--border))] rounded" />
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
  shortLabel,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition -mb-px whitespace-nowrap ${
        active
          ? "border-[hsl(var(--accent))] text-white"
          : "border-transparent text-[hsl(var(--text-muted))] hover:text-[hsl(var(--text))]"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
      {count > 0 && (
        <span
          className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full ${
            active
              ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))]"
              : "bg-[hsl(var(--border))] text-[hsl(var(--text-muted))]"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ---------- Finding card ---------- */
function FindingCard({
  finding,
  onAsk,
}: {
  finding: Finding;
  onAsk?: (f: Finding) => void;
}) {
  const [open, setOpen] = useState(false);
  const isLong = finding.detail.length > 120;
  const showDetail = open || !isLong;

  return (
    <div
      className="border-l-2 pl-3 sm:pl-4 py-2 group"
      style={{ borderColor: severityColor(finding.severity) }}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className={`chip ${severityChip(finding.severity)} shrink-0 mt-0.5`}>
          {finding.severity}
        </span>
        <span
          className="font-medium text-sm flex-1 cursor-pointer"
          onClick={() => isLong && setOpen(!open)}
        >
          {finding.title}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {onAsk && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAsk(finding);
              }}
              className="text-[hsl(var(--text-muted))] hover:text-[hsl(var(--accent))] transition p-1 rounded opacity-0 group-hover:opacity-100"
              title="Ask about this"
              aria-label="Ask about this finding"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>
          )}
          {isLong && (
            <button
              onClick={() => setOpen(!open)}
              className="text-[hsl(var(--text-muted))] opacity-0 group-hover:opacity-100 transition p-1"
            >
              {open ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>
      <p
        className={`text-sm text-[hsl(var(--text-secondary))] leading-relaxed transition-all cursor-pointer ${
          !showDetail ? "line-clamp-2" : ""
        }`}
        onClick={() => isLong && setOpen(!open)}
      >
        {finding.detail}
      </p>
      {finding.pageHint && (
        <p className="text-xs text-[hsl(var(--text-muted))] mt-1">Reference: {finding.pageHint}</p>
      )}
    </div>
  );
}

/* ---------- Findings section ---------- */
function FindingsSection({
  title,
  icon,
  findings,
  onAsk,
  alwaysShowHeader = false,
}: {
  title: string;
  icon: React.ReactNode;
  findings?: Finding[];
  onAsk?: (f: Finding) => void;
  alwaysShowHeader?: boolean;
}) {
  if (!alwaysShowHeader && (!findings || findings.length === 0)) return null;
  return (
    <section className="card p-4 sm:p-6 mb-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <div className="space-y-3">
        {findings?.map((f, i) => (
          <FindingCard key={i} finding={f} onAsk={onAsk} />
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
        : "#E20A7F";
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

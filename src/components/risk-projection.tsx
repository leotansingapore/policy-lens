"use client";

import { Shield, TrendingUp, Lightbulb, ArrowRight } from "lucide-react";
import type { PersonalizedInsights, RiskLevel, RiskRow } from "@/lib/types";

function RiskBadge({ level }: { level: RiskLevel }) {
  const styles = {
    low: "bg-[#22c55e]/15 text-[#22c55e] border-[#22c55e]/30",
    medium: "bg-[#f5a524]/15 text-[#f5a524] border-[#f5a524]/30",
    high: "bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30",
  };
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-semibold uppercase border ${styles[level]}`}
    >
      {level}
    </span>
  );
}

export function RiskProjection({ insights }: { insights: PersonalizedInsights }) {
  return (
    <div className="space-y-6">
      {/* Summary */}
      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[hsl(var(--accent))]" /> Personalized assessment
        </h2>
        <p className="text-[hsl(var(--text))] leading-relaxed italic border-l-4 border-[hsl(var(--accent))] pl-4">
          &ldquo;{insights.summary}&rdquo;
        </p>
      </section>

      {/* 10-Year Risk Projection — table on desktop, cards on mobile */}
      <section className="card p-4 sm:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-[hsl(var(--accent))]" /> 10-year risk
          projection
        </h2>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto -mx-2 px-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[hsl(var(--border))]">
                <th className="text-left py-3 pr-4 text-[hsl(var(--text-muted))] font-medium">Category</th>
                <th className="text-center py-3 px-3 text-[hsl(var(--text-muted))] font-medium">Now</th>
                <th className="text-center py-3 px-3 text-[hsl(var(--text-muted))] font-medium">+5 yr</th>
                <th className="text-center py-3 px-3 text-[hsl(var(--text-muted))] font-medium">+10 yr</th>
              </tr>
            </thead>
            <tbody>
              {insights.riskProjection.map((row, i) => (
                <tr key={i} className="border-b border-[hsl(var(--border))]/50">
                  <td className="py-4 pr-4 font-medium text-[hsl(var(--text))]">{row.category}</td>
                  <RiskCell level={row.now.level} reason={row.now.reason} />
                  <RiskCell level={row.fiveYear.level} reason={row.fiveYear.reason} />
                  <RiskCell level={row.tenYear.level} reason={row.tenYear.reason} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="sm:hidden space-y-4">
          {insights.riskProjection.map((row, i) => (
            <MobileRiskCard key={i} row={row} />
          ))}
        </div>
      </section>

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <section className="card p-4 sm:p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <ArrowRight className="w-4 h-4 text-[hsl(var(--accent))]" /> Coverage to consider
          </h2>
          <ul className="space-y-2">
            {insights.recommendations.map((r, i) => (
              <li key={i} className="text-sm text-[hsl(var(--text))] flex gap-2">
                <span className="text-[hsl(var(--accent))] mt-0.5 shrink-0">&#x2192;</span>
                {r}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Tips */}
      {insights.tips.length > 0 && (
        <section className="card p-4 sm:p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-[#f5a524]" /> Tips for you
          </h2>
          <ol className="space-y-2 list-none">
            {insights.tips.map((t, i) => (
              <li key={i} className="text-sm text-[hsl(var(--text))] flex gap-3">
                <span className="shrink-0 w-6 h-6 rounded-full bg-[#f5a524]/15 text-[#f5a524] flex items-center justify-center text-xs font-bold">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </section>
      )}

      <p className="text-xs text-[hsl(var(--text-muted))] text-center mt-2">
        This is not financial advice. Projections are illustrative only. Consult a licensed financial advisor before making policy decisions.
      </p>
    </div>
  );
}

function RiskCell({ level, reason }: { level: RiskLevel; reason: string }) {
  return (
    <td className="py-4 px-3 text-center align-top">
      <div className="flex flex-col items-center gap-1.5">
        <RiskBadge level={level} />
        <span className="text-xs text-[hsl(var(--text-secondary))] leading-tight max-w-[160px]">
          {reason}
        </span>
      </div>
    </td>
  );
}

function MobileRiskCard({ row }: { row: RiskRow }) {
  return (
    <div className="border border-[hsl(var(--border))] rounded-lg p-3">
      <div className="font-medium text-sm text-[hsl(var(--text))] mb-3">{row.category}</div>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { label: "Now", ...row.now },
          { label: "+5 yr", ...row.fiveYear },
          { label: "+10 yr", ...row.tenYear },
        ].map((col) => (
          <div key={col.label}>
            <div className="text-xs text-[hsl(var(--text-muted))] mb-1">{col.label}</div>
            <RiskBadge level={col.level} />
            <p className="text-xs text-[hsl(var(--text-secondary))] leading-tight mt-1">{col.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

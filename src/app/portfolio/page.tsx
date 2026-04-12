"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadPortfolio, deletePolicy } from "@/lib/storage";
import type { PolicyAnalysis } from "@/lib/types";
import { FileText, Trash2, Plus } from "lucide-react";

export default function PortfolioPage() {
  const [items, setItems] = useState<PolicyAnalysis[] | null>(null);

  useEffect(() => {
    setItems(loadPortfolio());
  }, []);

  function onDelete(id: string) {
    deletePolicy(id);
    setItems(loadPortfolio());
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-14">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="text-3xl font-semibold mb-1">My portfolio</h1>
          <p className="text-[#a1a1aa]">Every policy you have analyzed, saved to this browser.</p>
        </div>
        <Link href="/" className="btn btn-primary">
          <Plus className="w-4 h-4" /> Analyze new
        </Link>
      </div>

      {items === null ? (
        <div className="text-[#71717a]">Loading…</div>
      ) : items.length === 0 ? (
        <div className="card p-12 text-center">
          <FileText className="w-10 h-10 text-[#71717a] mx-auto mb-3" />
          <h3 className="font-semibold mb-1">No policies yet</h3>
          <p className="text-sm text-[#a1a1aa] mb-5">
            Upload your first policy to start building your portfolio.
          </p>
          <Link href="/" className="btn btn-primary">
            Analyze a policy
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((p) => {
            const critical =
              (p.exclusions?.filter((f) => f.severity === "critical").length ?? 0) +
              (p.gaps?.filter((f) => f.severity === "critical").length ?? 0) +
              (p.redFlags?.filter((f) => f.severity === "critical").length ?? 0);
            const warnings =
              (p.exclusions?.filter((f) => f.severity === "warning").length ?? 0) +
              (p.gaps?.filter((f) => f.severity === "warning").length ?? 0) +
              (p.redFlags?.filter((f) => f.severity === "warning").length ?? 0);
            return (
              <div key={p.id} className="card p-5 flex flex-col gap-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/policy/${p.id}`} className="flex-1 min-w-0">
                    <div className="text-xs uppercase tracking-wide text-[#71717a] mb-1">
                      {p.policyType}
                    </div>
                    <div className="font-semibold truncate">
                      {p.planName ?? p.fileName}
                    </div>
                    <div className="text-sm text-[#a1a1aa] truncate">
                      {p.insurer ?? "Unknown insurer"}
                    </div>
                  </Link>
                  <button
                    className="text-[#71717a] hover:text-red-400 p-1"
                    onClick={() => onDelete(p.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {critical > 0 && (
                    <span className="chip chip-danger">{critical} critical</span>
                  )}
                  {warnings > 0 && (
                    <span className="chip chip-warn">{warnings} warnings</span>
                  )}
                  {p.annualPremium && (
                    <span className="chip">Premium {p.annualPremium}</span>
                  )}
                  {p.sumAssured && <span className="chip">Sum {p.sumAssured}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-[#71717a]">
        This is not financial advice. Consult a licensed financial advisor before making policy decisions.
      </footer>
    </main>
  );
}

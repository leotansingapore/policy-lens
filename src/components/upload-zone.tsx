"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText, RotateCcw } from "lucide-react";
import { savePolicy } from "@/lib/storage";
import type { PolicyAnalysis, PolicyType } from "@/lib/types";

const POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: "life", label: "Life" },
  { value: "health", label: "Health / Shield" },
  { value: "critical-illness", label: "Critical illness" },
  { value: "other", label: "Other" },
];

const STAGES = [
  { key: "upload", label: "Uploading PDF" },
  { key: "extract", label: "Extracting text" },
  { key: "analyze", label: "Analyzing fine print" },
  { key: "save", label: "Saving to portfolio" },
] as const;

type StageKey = (typeof STAGES)[number]["key"];

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [policyType, setPolicyType] = useState<PolicyType>("life");
  const [busy, setBusy] = useState(false);
  const [currentStage, setCurrentStage] = useState<StageKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function startTimer() {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  }
  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function onAnalyze() {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    setBusy(true);
    setError(null);
    startTimer();
    try {
      setCurrentStage("upload");
      const form = new FormData();
      form.append("file", file);
      form.append("policyType", policyType);

      setCurrentStage("extract");
      await new Promise((r) => setTimeout(r, 300));

      setCurrentStage("analyze");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      setCurrentStage("save");
      const analysis = data as PolicyAnalysis;
      savePolicy(analysis);
      stopTimer();
      router.push(`/policy/${analysis.id}`);
    } catch (e) {
      stopTimer();
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
      setCurrentStage(null);
    }
  }

  const stageIdx = STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div className="card p-6 md:p-8">
      <div
        className="border-2 border-dashed border-[#2a2a30] hover:border-[hsl(var(--accent))] rounded-xl p-10 text-center cursor-pointer transition-colors"
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (busy) return;
          const f = e.dataTransfer.files?.[0];
          if (f) setFile(f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setError(null);
          }}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-[hsl(var(--accent))]" />
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-[hsl(var(--text-muted))]">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-[hsl(var(--text-muted))]" />
            <div>
              <span className="font-medium">Drop a PDF here</span>
              <span className="text-[hsl(var(--text-muted))]"> or click to browse</span>
            </div>
            <div className="text-xs text-[hsl(var(--text-muted))]">Max 50 MB · PDF only</div>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {POLICY_TYPES.map((t) => (
          <button
            key={t.value}
            onClick={() => setPolicyType(t.value)}
            disabled={busy}
            className={`chip ${
              policyType === t.value ? "chip-info" : ""
            } cursor-pointer hover:border-[hsl(var(--accent))]`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {busy && currentStage && (
        <div className="mt-5 space-y-2">
          {STAGES.map((s, i) => {
            const done = i < stageIdx;
            const active = i === stageIdx;
            return (
              <div key={s.key} className="flex items-center gap-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                    done
                      ? "bg-[#22c55e]/20 text-[#22c55e]"
                      : active
                        ? "bg-[hsl(var(--accent))]/20 text-[hsl(var(--accent))] ring-2 ring-[#E20A7F]/40"
                        : "bg-[hsl(var(--border))] text-[hsl(var(--text-muted))]"
                  }`}
                >
                  {done ? "\u2713" : active ? <Loader2 className="w-3 h-3 animate-spin" /> : i + 1}
                </div>
                <span
                  className={`text-sm ${
                    done
                      ? "text-[#22c55e]"
                      : active
                        ? "text-white"
                        : "text-[hsl(var(--text-muted))]"
                  }`}
                >
                  {s.label}
                  {active && s.key === "analyze" && elapsed > 3 && (
                    <span className="text-[hsl(var(--text-muted))] ml-2">({elapsed}s)</span>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!busy && !error && (
        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="text-sm text-[hsl(var(--text-secondary))]">Pick a policy type, then analyze.</div>
          <button className="btn btn-primary" onClick={onAnalyze} disabled={!file}>
            Analyze policy
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-4 rounded-lg border border-red-500/40 bg-red-500/10 text-sm">
          <div className="text-red-300 mb-3">{error}</div>
          <div className="flex gap-2">
            <button
              className="btn btn-ghost text-xs"
              onClick={() => {
                setError(null);
                onAnalyze();
              }}
            >
              <RotateCcw className="w-3 h-3" /> Retry
            </button>
            <button
              className="btn btn-ghost text-xs"
              onClick={() => {
                setError(null);
                setFile(null);
              }}
            >
              Pick a different file
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

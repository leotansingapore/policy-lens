"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Loader2, FileText } from "lucide-react";
import { savePolicy } from "@/lib/storage";
import type { PolicyAnalysis, PolicyType } from "@/lib/types";

const POLICY_TYPES: { value: PolicyType; label: string }[] = [
  { value: "life", label: "Life" },
  { value: "health", label: "Health / Shield" },
  { value: "critical-illness", label: "Critical illness" },
  { value: "other", label: "Other" },
];

export function UploadZone() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [policyType, setPolicyType] = useState<PolicyType>("life");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  async function onAnalyze() {
    if (!file) {
      inputRef.current?.click();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      setStage("Extracting text from PDF…");
      const form = new FormData();
      form.append("file", file);
      form.append("policyType", policyType);

      setStage("Sending to Claude for deep analysis…");
      const res = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed");

      const analysis = data as PolicyAnalysis;
      setStage("Saving to your portfolio…");
      savePolicy(analysis);
      router.push(`/policy/${analysis.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setBusy(false);
      setStage("");
    }
  }

  return (
    <div className="card p-6 md:p-8">
      <div
        className="border-2 border-dashed border-[#2a2a30] hover:border-[#7c5cff] rounded-xl p-10 text-center cursor-pointer transition-colors"
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
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {file ? (
          <div className="flex flex-col items-center gap-3">
            <FileText className="w-10 h-10 text-[#7c5cff]" />
            <div className="font-medium">{file.name}</div>
            <div className="text-xs text-[#71717a]">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Upload className="w-10 h-10 text-[#71717a]" />
            <div>
              <span className="font-medium">Drop a PDF here</span>
              <span className="text-[#71717a]"> or click to browse</span>
            </div>
            <div className="text-xs text-[#71717a]">Max 50 MB · PDF only</div>
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
            } cursor-pointer hover:border-[#7c5cff]`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <div className="text-sm text-[#a1a1aa]">
          {busy ? stage : "Pick a policy type, then analyze."}
        </div>
        <button className="btn btn-primary" onClick={onAnalyze} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing
            </>
          ) : (
            <>Analyze policy</>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded-lg border border-red-500/40 bg-red-500/10 text-sm text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}

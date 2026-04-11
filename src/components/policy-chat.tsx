"use client";

import { useState } from "react";
import { Send, MessageSquare, Loader2 } from "lucide-react";
import type { PolicyAnalysis } from "@/lib/types";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function PolicyChat({ policy }: { policy: PolicyAnalysis }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          policyContext: {
            insurer: policy.insurer,
            planName: policy.planName,
            policyType: policy.policyType,
            annualPremium: policy.annualPremium,
            sumAssured: policy.sumAssured,
            summary: policy.summary,
            coverageHighlights: policy.coverageHighlights,
            exclusions: policy.exclusions,
            gaps: policy.gaps,
            waitingPeriods: policy.waitingPeriods,
            redFlags: policy.redFlags,
            rawTextPreview: policy.rawTextPreview,
          },
        }),
      });

      if (!res.body) throw new Error("No response body");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        for (const line of chunk.split("\n")) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              answer += token;
              setMessages([...next, { role: "assistant", content: answer }]);
            } catch {}
          }
        }
      }
    } catch (e) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Error: ${e instanceof Error ? e.message : "chat failed"}`,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#7c5cff]" /> Ask about this policy
      </h2>

      <div className="space-y-3 mb-4 max-h-[420px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-sm text-[#71717a]">
            Try: &ldquo;What happens if I claim while overseas?&rdquo; · &ldquo;Does this cover
            early-stage cancer?&rdquo; · &ldquo;Should I keep this policy?&rdquo;
          </div>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`text-sm leading-relaxed p-3 rounded-lg ${
              m.role === "user"
                ? "bg-[#1a1530] border border-[#7c5cff]/30"
                : "bg-[#0f0f12] border border-[#1f1f24]"
            }`}
          >
            <div className="text-xs text-[#71717a] mb-1">
              {m.role === "user" ? "You" : "PolicyLens"}
            </div>
            <div className="whitespace-pre-wrap">{m.content || "…"}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          disabled={busy}
          placeholder="Ask a question about this policy…"
          className="flex-1 bg-[#09090b] border border-[#1f1f24] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7c5cff]"
        />
        <button className="btn btn-primary" onClick={send} disabled={busy}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
}

"use client";

import { useRef, useState } from "react";
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
  const taRef = useRef<HTMLTextAreaElement>(null);

  function autoresize() {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  }

  async function send() {
    const q = input.trim();
    if (!q || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    if (taRef.current) taRef.current.style.height = "auto";
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
            rawText: policy.rawTextPreview,
          },
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
          text && text.length < 400 ? text : `Chat failed (${res.status})`,
        );
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      setMessages([...next, { role: "assistant", content: "" }]);
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const token = JSON.parse(line.slice(2));
              if (typeof token === "string") {
                answer += token;
                setMessages([...next, { role: "assistant", content: answer }]);
              }
            } catch {}
          }
        }
      }
    } catch (e) {
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        const base =
          last?.role === "assistant" && last.content === ""
            ? prev.slice(0, -1)
            : prev;
        return [
          ...base,
          {
            role: "assistant",
            content: `Error: ${e instanceof Error ? e.message : "chat failed"}`,
          },
        ];
      });
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  const suggestions = [
    "What is the waiting period for major cancer?",
    "Am I covered if I claim overseas?",
    "Does this cover early-stage critical illnesses?",
    "Should I keep this policy?",
  ];

  return (
    <section className="card p-6">
      <h2 className="font-semibold mb-4 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-[#7c5cff]" /> Ask about this policy
      </h2>

      <div className="space-y-3 mb-4 max-h-[460px] overflow-y-auto">
        {messages.length === 0 && (
          <div className="space-y-2">
            <div className="text-sm text-[#71717a]">Try one of these:</div>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setInput(s);
                    taRef.current?.focus();
                    setTimeout(autoresize, 0);
                  }}
                  className="text-xs px-3 py-1.5 rounded-full border border-[#1f1f24] bg-[#0f0f12] text-[#a1a1aa] hover:text-white hover:border-[#7c5cff]/50 transition disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
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

      <div className="flex gap-2 items-end">
        <textarea
          ref={taRef}
          value={input}
          rows={1}
          onChange={(e) => {
            setInput(e.target.value);
            autoresize();
          }}
          onKeyDown={handleKey}
          disabled={busy}
          placeholder="Ask a question about this policy… (Shift+Enter for newline)"
          className="flex-1 bg-[#09090b] border border-[#1f1f24] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#7c5cff] resize-none min-h-[40px] max-h-[160px]"
        />
        <button
          className="btn btn-primary"
          onClick={send}
          disabled={busy || !input.trim()}
          aria-label="Send"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </section>
  );
}

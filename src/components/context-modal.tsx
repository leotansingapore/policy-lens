"use client";

import { useState, useEffect } from "react";
import { X, Loader2, User } from "lucide-react";
import type { UserContext } from "@/lib/types";

const STORAGE_KEY = "policylens.usercontext.v1";

export function loadUserContext(): UserContext | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveUserContext(ctx: UserContext) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (ctx: UserContext) => void;
  loading?: boolean;
}

export function ContextModal({ open, onClose, onSave, loading }: Props) {
  const [age, setAge] = useState("");
  const [income, setIncome] = useState("");
  const [dependents, setDependents] = useState("");
  const [existing, setExisting] = useState("");

  useEffect(() => {
    if (open) {
      const saved = loadUserContext();
      if (saved) {
        setAge(String(saved.age));
        setIncome(String(saved.monthlyIncome));
        setDependents(String(saved.dependents));
        setExisting(saved.existingCoverage);
      }
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ctx: UserContext = {
      age: parseInt(age) || 30,
      monthlyIncome: parseInt(income) || 0,
      dependents: parseInt(dependents) || 0,
      existingCoverage: existing.trim(),
    };
    saveUserContext(ctx);
    onSave(ctx);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative card p-6 w-full max-w-md mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="font-semibold text-lg mb-1 flex items-center gap-2">
          <User className="w-5 h-5 text-[#E20A7F]" />
          Your context
        </h2>
        <p className="text-sm text-[#a1a1aa] mb-5">
          Tell us about yourself so we can personalize the gap analysis and risk
          projection. This stays in your browser.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Age"
            value={age}
            onChange={setAge}
            type="number"
            placeholder="30"
            min="18"
            max="80"
            required
          />
          <Field
            label="Monthly income (S$)"
            value={income}
            onChange={setIncome}
            type="number"
            placeholder="5000"
            min="0"
          />
          <Field
            label="Number of dependents"
            value={dependents}
            onChange={setDependents}
            type="number"
            placeholder="0"
            min="0"
            max="10"
          />
          <div>
            <label className="block text-sm font-medium mb-1">
              Other existing coverage
            </label>
            <textarea
              value={existing}
              onChange={(e) => setExisting(e.target.value)}
              placeholder="e.g. Company group insurance, AIA HealthShield Gold, Prudential PRUActive Term..."
              rows={2}
              className="w-full bg-[#080D1A] border border-[#2C3B57] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E20A7F] resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!age || loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating
                insights...
              </>
            ) : (
              "Generate personalized analysis"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        max={max}
        required={required}
        className="w-full bg-[#080D1A] border border-[#2C3B57] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#E20A7F]"
      />
    </div>
  );
}

"use client";

import type { PolicyAnalysis } from "./types";

const KEY = "policylens.portfolio.v1";

export function loadPortfolio(): PolicyAnalysis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePolicy(policy: PolicyAnalysis) {
  const list = loadPortfolio();
  const next = [policy, ...list.filter((p) => p.id !== policy.id)];
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function getPolicy(id: string): PolicyAnalysis | null {
  return loadPortfolio().find((p) => p.id === id) ?? null;
}

export function deletePolicy(id: string) {
  const list = loadPortfolio().filter((p) => p.id !== id);
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

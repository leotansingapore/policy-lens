export type PolicyType = "life" | "health" | "critical-illness" | "other";

export interface Finding {
  severity: "critical" | "warning" | "info" | "good";
  title: string;
  detail: string;
  pageHint?: string | null;
}

export interface PolicyAnalysis {
  id: string;
  fileName: string;
  policyType: PolicyType;
  insurer: string | null;
  planName: string | null;
  policyholder: string | null;
  annualPremium: string | null;
  sumAssured: string | null;
  summary: string;
  coverageHighlights: string[];
  exclusions: Finding[];
  gaps: Finding[];
  waitingPeriods: Finding[];
  redFlags: Finding[];
  questionsToAsk: string[];
  createdAt: string;
  rawTextPreview: string;
}

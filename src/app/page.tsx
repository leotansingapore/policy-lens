import { UploadZone } from "@/components/upload-zone";
import { Shield, FileSearch, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
      <section className="text-center max-w-3xl mx-auto mb-14">
        <div className="chip chip-info mx-auto mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))]" />
          Built for Singapore policies — Life, Health, CI, ILPs
        </div>
        <h1 className="text-4xl md:text-6xl font-heading font-semibold tracking-tight mb-5">
          See through the <span className="text-[hsl(var(--accent))]">fine print.</span>
        </h1>
        <p className="text-lg text-[hsl(var(--text-secondary))] max-w-2xl mx-auto">
          Drop your policy PDF in. Get a blunt second opinion on what it actually covers,
          the exclusions that will bite you, and the gaps your plan leaves on the table.
        </p>
      </section>

      <section id="upload" className="max-w-3xl mx-auto mb-20">
        <UploadZone />
        <p className="text-xs text-center text-[hsl(var(--text-muted))] mt-3">
          Stays in your browser. Policies save to your device, not a server.
        </p>
        <p className="text-xs text-center text-[hsl(var(--text-muted))] mt-1">
          This is not financial advice. Always consult a licensed financial advisor before making policy decisions.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4 mb-20">
        <FeatureCard
          icon={<FileSearch className="w-5 h-5" />}
          title="Fine-print decoder"
          body="Reads the 100+ pages of legal definitions so you don't have to. Waiting periods, survival clauses, CI definition tiers — surfaced in plain English."
        />
        <FeatureCard
          icon={<AlertTriangle className="w-5 h-5" />}
          title="Gap hunter"
          body="Highlights what the policy quietly does NOT cover — mental health carve-outs, overseas claim limits, pre-ex exclusions, premium-term vs coverage-term mismatches."
        />
        <FeatureCard
          icon={<Shield className="w-5 h-5" />}
          title="Red-flag detector"
          body="Flags non-guaranteed projections, surrender traps, par-fund underperformance, and the clauses that turn into claim denials at the worst possible moment."
        />
      </section>

      <section className="card p-8 md:p-10 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Already analyzed a few?</h2>
          <p className="text-[hsl(var(--text-secondary))]">
            Your portfolio lives in this browser. Review everything in one place.
          </p>
        </div>
        <Link href="/portfolio" className="btn btn-primary">
          Open my portfolio <ArrowRight className="w-4 h-4" />
        </Link>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="card p-6">
      <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent))] grid place-items-center mb-4">
        {icon}
      </div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">{body}</p>
    </div>
  );
}

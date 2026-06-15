import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

export default function BinaInsightResultsPage() {
  return (
    <AppShell role="client" eyebrow="BinaInsight" title="Hasil Assessment">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Overall Score" value="4.1" detail="Demo result until scoring is connected." />
        <StatCard label="Readiness" value="High" detail="Assessment output will feed the report engine." />
        <StatCard label="Next Step" value="Review" detail="Facilitator can add notes after submission." />
      </div>
    </AppShell>
  );
}

import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";

export default function BinaInsightResultsPage() {
  return (
    <AppShell role="client" eyebrow="BinaInsight" title="Hasil Assessment">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Skor Keseluruhan" value="—" detail="Skor akan muncul setelah assessment selesai." />
        <StatCard label="Kesiapan" value="—" detail="Hasil assessment akan memberi umpan ke mesin laporan." />
        <StatCard label="Langkah Selanjutnya" value="Tinjau" detail="Fasilitator dapat menambah catatan setelah pengiriman." />
      </div>
    </AppShell>
  );
}

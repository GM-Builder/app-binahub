import type { ContactRecord, ProjectRecord } from "./types";

export function uniqueOptions<T>(items: T[], getter: (item: T) => string | undefined | null) {
  return Array.from(new Set(items.map(getter).filter(Boolean) as string[])).sort((a, b) =>
    a.localeCompare(b)
  );
}

export function isProjectCompleted(project: ProjectRecord) {
  return /(completed|complete|selesai|closed|done|deal|finished)/i.test(project.status || "");
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function daysSince(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, Math.floor((Date.now() - timestamp) / 86_400_000));
}

export function getSmartContactStatus(contact: ContactRecord) {
  const text = [contact.source, contact.sourceType, contact.category, contact.status, contact.message, contact.notes]
    .join(" ")
    .toLowerCase();
  const age = daysSince(contact.createdAt);

  if (text.includes("client") || text.includes("proposal") || text.includes("qualified")) return "Client";
  if (text.includes("assessment") || text.includes("insight")) return "Lead Assessment";
  if (text.includes("follow up") || age >= 2) return "Perlu Follow Up";
  if (text.includes("archived") || text.includes("diarsipkan")) return "Diarsipkan";
  if (contact.sourceType === "coach" || contact.sourceType === "employee") return "Internal";
  return "Lead Baru";
}

export function exportCsv(filename: string, rows: Array<Record<string, string | number | null | undefined>>) {
  const headers = Object.keys(rows[0] || {});
  const csv = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => `"${String(row[header] ?? "").replace(/"/g, '""')}"`)
        .join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

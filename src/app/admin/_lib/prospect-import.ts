import { z } from "zod";

const prospectSchema = z.object({
  name: z.string().trim().min(1).max(300), email: z.string().trim().toLowerCase().max(320),
  externalId: z.string().max(300).nullable().optional(), company: z.string().max(300).nullable().optional(),
  phone: z.string().max(80).nullable().optional(), roleTitle: z.string().max(200).nullable().optional(),
  industry: z.string().max(200).nullable().optional(), location: z.string().max(300).nullable().optional(),
  employeeRange: z.string().max(100).nullable().optional(), websiteUrl: z.string().url().nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(), sourceUrl: z.string().url().nullable().optional(),
  consentStatus: z.enum(["unknown", "opted_in", "not_required", "opted_out"]).default("unknown"),
}).strict();
export type ImportedProspect = z.infer<typeof prospectSchema>;
export const MAX_IMPORT_TARGETS = 500;

export function parseCsvRows(value: string) {
  const rows: string[][] = [];
  let row: string[] = [], field = "", quoted = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];
    if (character === '"' && quoted && value[index + 1] === '"') { field += '"'; index += 1; continue; }
    if (character === '"') { quoted = !quoted; continue; }
    if (character === "," && !quoted) { row.push(field.trim()); field = ""; continue; }
    if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && value[index + 1] === "\n") index += 1;
      row.push(field.trim()); field = "";
      if (row.some(Boolean)) rows.push(row);
      row = []; continue;
    }
    field += character;
  }
  if (quoted) throw new Error("Tanda kutip CSV belum ditutup. Periksa file Anda.");
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function validateImportedProspects(value: unknown) {
  const parsed = z.array(prospectSchema).min(1).max(MAX_IMPORT_TARGETS).safeParse(value);
  if (!parsed.success) throw new Error(`Data harus berisi 1–${MAX_IMPORT_TARGETS} target dengan nama, email, dan kolom yang sesuai template. Tidak ada baris yang dipotong otomatis.`);
  return parsed.data;
}

export function prospectsFromCsv(value: string) {
  const rows = parseCsvRows(value.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("CSV harus memiliki header dan minimal satu baris prospek.");
  const headers = rows[0].map((header) => header.trim().toLowerCase().replaceAll(/[\s-]+/g, "_"));
  if (new Set(headers).size !== headers.length) throw new Error("Header CSV memiliki nama kolom ganda.");
  const get = (values: string[], ...names: string[]) => {
    const index = names.map((name) => headers.indexOf(name)).find((item) => item >= 0) ?? -1;
    return index >= 0 ? values[index]?.trim() || null : null;
  };
  return validateImportedProspects(rows.slice(1).map((values, index) => {
    const name = get(values, "name", "full_name", "contact_name") || [get(values, "first_name", "firstname"), get(values, "last_name", "lastname")].filter(Boolean).join(" ");
    const email = get(values, "email", "work_email", "email_address");
    if (!name || !email) throw new Error(`Baris ${index + 2} harus memiliki nama dan email.`);
    return { name, email, externalId: get(values, "external_id", "id"), company: get(values, "company", "organization", "company_name"),
      roleTitle: get(values, "role_title", "title", "position", "job_title"), industry: get(values, "industry"), location: get(values, "location", "city"),
      employeeRange: get(values, "employee_range", "headcount", "employee_count"), websiteUrl: get(values, "website_url", "website", "domain"),
      linkedinUrl: get(values, "linkedin_url", "linkedin"), sourceUrl: get(values, "source_url"), consentStatus: get(values, "consent_status") || "unknown" };
  }));
}

export function parseManualTargets(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("[")) return validateImportedProspects(JSON.parse(trimmed));
  if (/^(?:name|full_name|first_name|email|company),/i.test(trimmed)) return prospectsFromCsv(trimmed);
  if (trimmed.includes("\t")) throw new Error("Gunakan CSV dengan pemisah koma, atau tempel satu email per baris.");
  // Email-only lists use a neutral salutation; no invented personal identity or consent.
  return validateImportedProspects(trimmed.split(/[\s,;]+/).filter(Boolean).map((email) => ({ name: "Bapak/Ibu", email, consentStatus: "unknown" })));
}

export function importRowIssue(row: ImportedProspect, earlier: ImportedProspect[]) {
  if (!z.email().safeParse(row.email).success) return "Format email tidak valid";
  if (earlier.some((item) => item.email === row.email)) return "Email ganda dalam daftar ini";
  if (row.consentStatus === "opted_out") return "Tidak boleh dihubungi";
  return null;
}

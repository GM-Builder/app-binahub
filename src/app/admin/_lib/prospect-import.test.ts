import { describe, expect, it } from "vitest";
import { importRowIssue, parseManualTargets, parseCsvRows, prospectsFromCsv, validateImportedProspects } from "./prospect-import";
describe("guided target import", () => {
  it("accepts an email-only list without inventing identity or consent", () => {
    expect(parseManualTargets(" HR@example.com\nceo@example.com ")).toEqual([{ name: "Bapak/Ibu", email: "hr@example.com", consentStatus: "unknown" }, { name: "Bapak/Ibu", email: "ceo@example.com", consentStatus: "unknown" }]);
  });
  it("never silently truncates an oversized list", () => {
    expect(() => parseManualTargets(Array.from({ length: 501 }, (_, index) => `a${index}@example.com`).join("\n"))).toThrow("Tidak ada baris yang dipotong");
  });
  it("rejects malformed CSV, duplicate headers and unexpected JSON fields", () => {
    expect(() => parseManualTargets("name\temail\nRina\trina@example.com")).toThrow("pemisah koma");
    expect(() => parseCsvRows('name,email\n"Rina,rina@example.com')).toThrow("belum ditutup");
    expect(() => prospectsFromCsv("name,email,email\nRina,rina@example.com,a@example.com")).toThrow("kolom ganda");
    expect(() => validateImportedProspects([{ name: "Rina", email: "rina@example.com", skipApproval: true }])).toThrow();
  });
  it("flags malformed, repeated and opted-out emails for review", () => {
    const rows = parseManualTargets("a@example.com a@example.com invalid");
    expect(importRowIssue(rows[0], [])).toBeNull();
    expect(importRowIssue(rows[1], [rows[0]])).toContain("ganda");
    expect(importRowIssue(rows[2], [])).toContain("tidak valid");
    expect(importRowIssue({ ...rows[0], consentStatus: "opted_out" }, [])).toContain("Tidak boleh");
  });
});

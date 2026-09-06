import { describe, expect, it } from "vitest";
import { parseCsvRows, prospectsFromCsv } from "./acquisition-control-panel";

describe("manual prospect import", () => {
  it("parses quoted CSV values without splitting embedded commas", () => {
    const rows = parseCsvRows('name,email,company\n"Rina Contoh",rina@contoh.co.id,"PT Contoh, Indonesia"');
    expect(rows[1]).toEqual(["Rina Contoh", "rina@contoh.co.id", "PT Contoh, Indonesia"]);
  });

  it("maps common Apollo-style columns to the governed prospect shape", () => {
    const prospects = prospectsFromCsv([
      "first_name,last_name,email,organization,title,headcount",
      "Rina,Contoh,rina@contoh.co.id,PT Contoh,HR Director,51-200",
    ].join("\n"));
    expect(prospects).toEqual([expect.objectContaining({
      name: "Rina Contoh",
      email: "rina@contoh.co.id",
      company: "PT Contoh",
      roleTitle: "HR Director",
      employeeRange: "51-200",
      consentStatus: "unknown",
    })]);
  });

  it("rejects rows without the minimum identity fields", () => {
    expect(() => prospectsFromCsv("company,email\nPT Contoh,"))
      .toThrow("Baris 2 harus memiliki nama dan email.");
  });
});

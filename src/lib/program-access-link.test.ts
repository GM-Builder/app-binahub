import { describe, expect, it } from "vitest";
import { programAccessPath, programAccessUrl, programInvitationText } from "./program-access-link";

describe("program access links", () => {
  it("binds the public link to one program without exposing its access code", () => {
    const path = programAccessPath("program-123");
    expect(path).toBe("/client/access?program=program-123");
    expect(path).not.toContain("SECRET-CODE");
  });

  it("builds a shareable invitation containing separate link and code", () => {
    const text = programInvitationText({
      programId: "program-123",
      code: "BINA-2026",
      title: "Leadership Camp",
      origin: "https://app.binahub.id/",
    });
    expect(text).toContain("https://app.binahub.id/client/access?program=program-123");
    expect(text).toContain("Kode akses: BINA-2026");
  });

  it("normalizes a trailing slash in the application origin", () => {
    expect(programAccessUrl("program-123", "https://app.binahub.id/"))
      .toBe("https://app.binahub.id/client/access?program=program-123");
  });
});

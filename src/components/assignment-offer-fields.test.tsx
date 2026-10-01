import { describe, expect, it } from "vitest";
import { parseAssignmentOffer } from "./assignment-offer-fields";

const deadlineAfter = (milliseconds: number) => new Date(Date.now() + milliseconds).toISOString();

describe("assignment offer validation", () => {
  it("keeps optional fee components absent when admin leaves them blank", () => {
    const result = parseAssignmentOffer({
      compensation: "1000000",
      transport: "250000",
      preparation: "",
      deadline: deadlineAfter(72 * 60 * 60_000),
    });
    expect(result.fee).toEqual({ compensation: 1_000_000, transport: 250_000 });
    expect(result.invitationExpiresAt).toBeTruthy();
  });

  it("rejects an invitation without compensation", () => {
    expect(() => parseAssignmentOffer({
      compensation: "",
      transport: "250000",
      preparation: "",
      deadline: deadlineAfter(72 * 60 * 60_000),
    })).toThrow(/kompensasi/i);
  });

  it("accepts any whole-rupiah amount without a thousand-step offset", () => {
    expect(parseAssignmentOffer({ compensation: "2000000", transport: "250000", preparation: "", deadline: deadlineAfter(72 * 60 * 60_000) }).fee)
      .toEqual({ compensation: 2_000_000, transport: 250_000 });
    expect(() => parseAssignmentOffer({ compensation: "2000000.5", transport: "", preparation: "", deadline: deadlineAfter(72 * 60 * 60_000) }))
      .toThrow(/rupiah bulat/i);
  });

  it("rejects an expired or overly distant response deadline", () => {
    for (const deadline of [deadlineAfter(-60_000), deadlineAfter(31 * 24 * 60 * 60_000)]) {
      expect(() => parseAssignmentOffer({ compensation: "1000000", transport: "", preparation: "", deadline })).toThrow(/batas respons/i);
    }
  });
});

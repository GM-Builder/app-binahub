import { beforeEach, describe, expect, it } from "vitest";
import { getQueuedObservations, queueObservation } from "./api-client";

describe("T-BOS offline queue", () => {
  beforeEach(() => localStorage.clear());

  it("isolates queued observations by facilitator", () => {
    const input = {
      teamId: crypto.randomUUID(),
      missionId: crypto.randomUUID(),
      batch: "Batch 1",
      notes: "",
      scores: [{ dimensionId: crypto.randomUUID(), levelValue: 4 }],
    };

    queueObservation("facilitator-a", input);

    expect(getQueuedObservations("facilitator-a")).toHaveLength(1);
    expect(getQueuedObservations("facilitator-b")).toHaveLength(0);
    expect(getQueuedObservations("facilitator-a")[0].profileId).toBe("facilitator-a");
  });

  it("keeps a stable idempotency key in the queue", () => {
    queueObservation("facilitator-a", {
      teamId: crypto.randomUUID(),
      missionId: crypto.randomUUID(),
      clientSubmissionId: "submission-123",
      batch: "Batch 1",
      notes: "",
      scores: [{ dimensionId: crypto.randomUUID(), levelValue: 4 }],
    });

    expect(getQueuedObservations("facilitator-a")[0].clientSubmissionId).toBe("submission-123");
  });

  it("keeps the submitted roster snapshot in the queue", () => {
    const memberId = crypto.randomUUID();
    queueObservation("facilitator-a", {
      teamId: crypto.randomUUID(),
      missionId: crypto.randomUUID(),
      batch: "Batch 1",
      notes: "",
      scores: [{ dimensionId: crypto.randomUUID(), levelValue: 4 }],
      members: [{
        teamMemberId: memberId,
        memberName: "Captain A",
        isPresent: true,
        isCaptain: true,
      }],
    });

    expect(getQueuedObservations("facilitator-a")[0].members).toEqual([{
      teamMemberId: memberId,
      memberName: "Captain A",
      isPresent: true,
      isCaptain: true,
    }]);
  });
});

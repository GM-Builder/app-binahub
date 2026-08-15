import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushQueuedObservations, getQueuedObservations, queueObservation } from "./api-client";

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

  it("keeps new-team data and forwards it during queue flush", async () => {
    const newTeam = {
      name: "Tim Offline",
      batchId: crypto.randomUUID(),
      programId: crypto.randomUUID(),
    };
    queueObservation("facilitator-a", {
      newTeam,
      missionId: crypto.randomUUID(),
      batch: "Batch Lapangan",
      notes: "Offline",
      scores: [{ dimensionId: crypto.randomUUID(), levelValue: 4 }],
      members: [{ memberName: "Captain Offline", isPresent: true, isCaptain: true }],
    });

    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(JSON.stringify({
      success: true,
      observationId: crypto.randomUUID(),
    }), { status: 200, headers: { "Content-Type": "application/json" } }));

    await expect(flushQueuedObservations("facilitator-a")).resolves.toBe(1);
    expect(getQueuedObservations("facilitator-a")).toHaveLength(0);
    const request = fetchMock.mock.calls[0]?.[1];
    expect(JSON.parse(String(request?.body))).toMatchObject({ newTeam });
    fetchMock.mockRestore();
  });
});

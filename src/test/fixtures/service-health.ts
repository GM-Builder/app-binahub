export function syntheticServiceHealth(state = "healthy") {
  if (state === "setup_required" || state === "unavailable")
    return {
      success: true,
      health: { readiness: state, operations: "unknown" },
    };
  return {
    success: true,
    health: {
      readiness: "ready",
      operations: state === "healthy" ? "healthy" : "attention",
      checkedAt: new Date().toISOString(),
      overdueMinutes: 10,
      queues: [
        "team_analysis",
        "individual_email",
        "program_analysis",
        "program_email",
      ].map((key, index) => ({
        key,
        pending: state === "attention" && index === 2 ? 125 : 0,
        processing: 0,
        overdue: state === "attention" && index === 2 ? 125 : 0,
        stalled: 0,
        review: 0,
        oldestDueAt:
          state === "attention" && index === 2
            ? new Date(Date.now() - 30 * 60_000).toISOString()
            : null,
      })),
      worker:
        state === "never_seen"
          ? { state: "never_seen" }
          : {
              state: state === "attention" ? "stale" : "recent",
              startedAt: new Date(Date.now()-(state==='attention'?31:0)*60_000).toISOString(),
              finishedAt: new Date(Date.now()-(state==='attention'?30:0)*60_000).toISOString(),
              succeededAt: new Date(Date.now()-(state==='attention'?30:0)*60_000).toISOString(),
            },
      alertChannel: "admin_dashboard",
      externalAlertsEnabled: false,
    },
  };
}

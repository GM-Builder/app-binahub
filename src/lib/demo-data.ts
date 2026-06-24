export const clientProgress = [
  {
    client: "Andini Pratama",
    organization: "Demo Organization",
    binainsight: "Completed",
    binaimpact: "Level 1 Completed",
  },
  {
    client: "Raka Mahendra",
    organization: "Demo Organization",
    binainsight: "Not Started",
    binaimpact: "In Progress",
  },
];

export const facilitatorReviews = [
  {
    client: "Andini Pratama",
    module: "BinaImpact",
    model: "Model A",
    status: "Awaiting Review",
  },
  {
    client: "Andini Pratama",
    module: "BinaInsight",
    model: "Assessment Result",
    status: "Reviewed",
  },
];

export const impactModels = ["Model A", "Model B", "Model C", "Model D"].map(
  (name, index) => ({
    id: `model-${index + 1}`,
    name,
    levels: [
      { name: "Level 1", sections: ["Bagian 1", "Bagian 2", "Bagian 3"] },
      {
        name: "Level 2",
        sections: ["Pre-test", "Post-test", "Penilaian Fasilitator"],
      },
    ],
  }),
);

export const transformationEngagements = [
  {
    id: "eng-leadership-readiness",
    title: "Leadership Readiness Sprint",
    organization: "Demo Organization",
    type: "Transformation Program",
    status: "In Progress",
    progress: 64,
    participants: 18,
    risk: "Medium",
    activeStage: "Evidence collection",
    nextStep: "Review facilitator observations",
    startDate: "2026-06-03",
    endDate: "2026-07-12",
  },
  {
    id: "eng-culture-health",
    title: "Culture Health Baseline",
    organization: "Demo Organization",
    type: "Assessment Project",
    status: "Review",
    progress: 82,
    participants: 42,
    risk: "Low",
    activeStage: "Capability recalculation",
    nextStep: "Publish executive insight",
    startDate: "2026-05-18",
    endDate: "2026-06-24",
  },
  {
    id: "eng-coaching-circle",
    title: "Manager Coaching Circle",
    organization: "Demo Organization",
    type: "Coaching Program",
    status: "Active",
    progress: 28,
    participants: 9,
    risk: "High",
    activeStage: "Participant assignment",
    nextStep: "Collect first reflection",
    startDate: "2026-06-17",
    endDate: "2026-08-08",
  },
];

export const transformationParticipants = [
  {
    id: "pt-andini",
    name: "Andini Pratama",
    roleTitle: "People Partner",
    department: "Human Capital",
    engagementId: "eng-leadership-readiness",
    evidenceCount: 7,
    capabilityScore: 78,
    actionProgress: 70,
    reviewStatus: "Needs facilitator review",
  },
  {
    id: "pt-raka",
    name: "Raka Mahendra",
    roleTitle: "Operations Lead",
    department: "Operations",
    engagementId: "eng-leadership-readiness",
    evidenceCount: 4,
    capabilityScore: 66,
    actionProgress: 45,
    reviewStatus: "Observation pending",
  },
  {
    id: "pt-nadia",
    name: "Nadia Kusuma",
    roleTitle: "Project Manager",
    department: "Transformation Office",
    engagementId: "eng-culture-health",
    evidenceCount: 9,
    capabilityScore: 84,
    actionProgress: 88,
    reviewStatus: "Ready for report",
  },
];

export const transformationEvidence = [
  {
    id: "ev-001",
    type: "Reflection Entry",
    source: "Participant",
    participant: "Andini Pratama",
    engagement: "Leadership Readiness Sprint",
    capability: "Communication",
    confidence: 0.72,
    timestamp: "Today, 09:20",
    preview: "Mulai lebih eksplisit menutup meeting dengan decision owner dan follow-up date.",
  },
  {
    id: "ev-002",
    type: "Facilitator Observation",
    source: "Facilitator",
    participant: "Raka Mahendra",
    engagement: "Leadership Readiness Sprint",
    capability: "Execution",
    confidence: 0.81,
    timestamp: "Yesterday, 16:40",
    preview: "Mampu memecah target tim menjadi eksperimen mingguan, tetapi masih perlu konsistensi review.",
  },
  {
    id: "ev-003",
    type: "Assessment Result",
    source: "System",
    participant: "Nadia Kusuma",
    engagement: "Culture Health Baseline",
    capability: "Strategic Thinking",
    confidence: 0.9,
    timestamp: "Jun 19, 2026",
    preview: "Skor strategic thinking naik 11 poin dari baseline awal program.",
  },
];

export const transformationCapabilities = [
  { name: "Leadership", score: 76, trend: "up", evidenceCount: 12 },
  { name: "Communication", score: 81, trend: "up", evidenceCount: 9 },
  { name: "Collaboration", score: 69, trend: "stable", evidenceCount: 8 },
  { name: "Execution", score: 73, trend: "up", evidenceCount: 11 },
  { name: "Strategic Thinking", score: 67, trend: "down", evidenceCount: 6 },
];

export const transformationActions = [
  {
    id: "act-001",
    title: "Run weekly decision log",
    assignee: "Andini Pratama",
    engagement: "Leadership Readiness Sprint",
    status: "In Progress",
    dueDate: "Jun 24, 2026",
    progress: 70,
  },
  {
    id: "act-002",
    title: "Submit coaching reflection",
    assignee: "Raka Mahendra",
    engagement: "Manager Coaching Circle",
    status: "To Do",
    dueDate: "Jun 23, 2026",
    progress: 0,
  },
  {
    id: "act-003",
    title: "Validate culture risk themes",
    assignee: "Nadia Kusuma",
    engagement: "Culture Health Baseline",
    status: "Blocked",
    dueDate: "Jun 26, 2026",
    progress: 35,
  },
];

export const transformationEvents = [
  {
    type: "EvidenceCreated",
    status: "done",
    payload: "Reflection Entry -> Communication",
    timestamp: "09:20",
  },
  {
    type: "CapabilityRecalculated",
    status: "done",
    payload: "Andini Pratama -> Communication 81",
    timestamp: "09:21",
  },
  {
    type: "InsightGenerated",
    status: "pending",
    payload: "Leadership Readiness Sprint summary",
    timestamp: "Queued",
  },
];

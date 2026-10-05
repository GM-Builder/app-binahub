import type { AssessmentRecord, DashboardData } from "@/app/admin/_lib/types";

// Synthetic data only. Shared by component tests and the isolated local preview.
export function assessmentFixture(overrides: Partial<AssessmentRecord> = {}): AssessmentRecord {
  return {
    id: "demo-assessment-1", name: "Nadia Putri", company: "PT Aurora Nusantara",
    email: "nadia@example.com", role: "HR Manager", whatsapp: "", employees: "51–100",
    industry: "Teknologi", location: "Jakarta", timeline: "0_3", nextStepIntent: "explore",
    category: "Berkembang", overallScore: 62,
    challenge: "Kolaborasi antartim belum konsisten. Kami ingin para manajer lebih percaya diri memimpin perubahan.",
    target: "Menyelaraskan prioritas tim dan membangun kebiasaan komunikasi yang lebih terbuka.",
    businessConsequence: "Keputusan proyek menjadi lambat dan prioritas sering berubah.",
    scores: { Insights: 57, Lab: 64, Coach: 60, Play: 72, Academy: 66, Works: 71, Impact: 66 },
    aiAnalysis: "Organisasi memiliki fondasi yang baik untuk bertumbuh. Prioritas awal adalah menyelaraskan cara kerja lintas fungsi dan memperkuat keterampilan kepemimpinan para manajer.",
    recommendations: [
      { title: "Selaraskan cara kerja tim", service: "BinaLab", description: "Bangun komunikasi yang lebih jelas dan kesepakatan kerja bersama melalui program pengembangan tim." },
      { title: "Perkuat kepemimpinan", service: "BinaCoach", description: "Dampingi manajer menghadapi tantangan kepemimpinan dan menerapkan kebiasaan kerja yang efektif." },
    ],
    answers: { 1: 3, 2: 4, 3: 2 }, assessmentStatus: "Minta Proposal",
    resultEmailSentAt: "2026-10-01T03:00:00Z", resultEmailId: "demo-result-email",
    proposalStatus: "Diminta", proposalRequestedAt: "2026-10-05T03:00:00Z",
    proposalSentAt: null, proposalEmailId: null, createdAt: "2026-10-01T02:50:00Z",
    proposalEligibility: { eligible: true, missing: [], summary: "Data assessment lengkap." },
    leadTemperature: "warm", leadScore: 80, leadScoreConfidence: 1,
    leadScoreRuleVersion: "v1.1-public-diagnostic", lifecycleStage: "lead", opportunityStage: "identified",
    ...overrides,
  };
}

export const assessmentPreviewRecords = [
  assessmentFixture({ createdAt: "2026-10-05T03:00:00Z", proposalStatus: "Gagal Otomatis", proposalGateReasons: [{ code: "generation_failed", message: "Penyusunan proposal belum berhasil. Silakan coba ulang.", severity: "blocking" }] }),
  assessmentFixture({ id: "demo-assessment-2", name: "Arif Pratama", company: "Studio Cakrawala", role: "Founder", employees: "11–50", proposalStatus: "Terkirim", proposalSentAt: "2026-10-03T03:00:00Z", proposalEmailId: "demo-proposal-email", assessmentStatus: "Proposal Terkirim", createdAt: "2026-10-04T03:00:00Z" }),
  assessmentFixture({ id: "demo-assessment-3", name: "Dina Maheswari", company: "Meridian Group", role: "People Director", employees: "101–250", proposalStatus: "Sedang Disusun", createdAt: "2026-10-03T03:00:00Z" }),
  assessmentFixture({ id: "demo-assessment-4", name: "Reza Aditya", company: "Lentera Digital", role: "CEO", proposalStatus: "Belum Diminta", assessmentStatus: "Result Otomatis Terkirim", createdAt: "2026-10-02T03:00:00Z" }),
];

export function assessmentDashboard(records: AssessmentRecord[]): DashboardData {
  return {
    generatedAt: "2026-10-05T03:00:00Z", summary: { totalAssessments: records.length, avgOverall: 62,
      strongestDimension: { dimension: "Play", average: 72, min: 72, max: 72 }, weakestDimension: { dimension: "Insights", average: 57, min: 57, max: 57 },
      mostCommonCategory: "Berkembang", totalContacts: 0, totalInquiries: 0, totalCoaches: 0 },
    dimensionStats: [], categoryBreakdown: [], employeeStats: [], answerDistribution: [], topRecommendations: [],
    assessments: records, contacts: [], inquiries: [], coaches: [], coachAssignments: [], coachSessions: [], coachAvailability: [], coachDocuments: [],
  } as DashboardData;
}

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { TbosDashboardData } from "@/modules/tbos/types";
import { generateExecutiveNarrative } from "@/modules/tbos/scoring";

const NAVY = "#0B2C6B";
const GOLD = "#D9A441";
const LIGHT_BG = "#F8F9FC";
const BORDER = "#E2E8F0";
const TEXT_DARK = "#1E293B";
const TEXT_MUTED = "#64748B";

Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyeMZhrib2Bg-4.ttf", fontWeight: 300 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fMZhrib2Bg-4.ttf", fontWeight: 400 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYMZhrib2Bg-4.ttf", fontWeight: 500 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYMZhrib2Bg-4.ttf", fontWeight: 600 },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuDyYMZhrib2Bg-4.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 10,
    color: TEXT_DARK,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 14,
    marginBottom: 20,
    borderBottomWidth: 3,
    borderBottomColor: GOLD,
    borderBottomStyle: "solid",
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: NAVY,
  },
  logoAccent: {
    color: GOLD,
  },
  tagline: {
    fontSize: 8,
    color: TEXT_MUTED,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 2,
    fontWeight: 500,
  },
  reportMeta: {
    textAlign: "right",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: NAVY,
  },
  reportDate: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.6,
    color: TEXT_DARK,
    backgroundColor: LIGHT_BG,
    padding: 10,
    borderRadius: 6,
  },
  statRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderRadius: 6,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: NAVY,
    borderLeftStyle: "solid",
  },
  statLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 3,
    fontWeight: 600,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 700,
    color: NAVY,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 3,
    backgroundColor: LIGHT_BG,
    borderRadius: 4,
  },
  rankBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dimensionName: {
    flex: 1,
    fontSize: 9,
    fontWeight: 600,
    color: TEXT_DARK,
  },
  scoreBadge: {
    fontSize: 10,
    fontWeight: 700,
    color: NAVY,
  },
  narrativeItem: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 6,
    borderLeftWidth: 2,
    borderLeftColor: GOLD,
    borderLeftStyle: "solid",
  },
  narrativeText: {
    fontSize: 8.5,
    lineHeight: 1.5,
    color: TEXT_DARK,
  },
  recommendationBox: {
    backgroundColor: NAVY,
    borderRadius: 8,
    padding: 14,
    marginTop: 10,
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#FFFFFF",
    opacity: 0.9,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: NAVY,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginBottom: 2,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    borderBottomStyle: "solid",
    alignItems: "center",
  },
  tableRowAlt: {
    backgroundColor: LIGHT_BG,
  },
  tableCell: {
    fontSize: 8.5,
    color: TEXT_DARK,
  },
  scoreBarContainer: {
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
    marginTop: 2,
    width: "100%",
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    borderTopStyle: "solid",
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
  pageNumber: {
    fontSize: 7,
    color: TEXT_MUTED,
    fontWeight: 600,
  },
});

function getScoreColor(score: number | null): string {
  if (score === null) return "#CBD5E1";
  if (score >= 4.5) return "#10B981";
  if (score >= 3.5) return "#84CC16";
  if (score >= 2.5) return "#F59E0B";
  if (score >= 1.5) return "#F97316";
  return "#EF4444";
}

function ScoreBarPdf({ score }: { score: number | null }) {
  const pct = score !== null ? Math.min((score / 5) * 100, 100) : 0;
  const color = getScoreColor(score);
  return (
    <View style={styles.scoreBarContainer}>
      <View style={{ height: "100%", width: `${pct}%`, backgroundColor: color, borderRadius: 3 }} />
    </View>
  );
}

function TbosReportDocument({ data }: { data: TbosDashboardData }) {
  const { executiveSummary: summary, batchComparisons, teams } = data;
  const narrative = generateExecutiveNarrative(summary, batchComparisons);
  const sortedTeams = [...teams].sort((a, b) => (b.overallTeamScore ?? -1) - (a.overallTeamScore ?? -1));

  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Bina<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>Team Behavioral Observation System</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>T-BOS Executive Report</Text>
            <Text style={styles.reportDate}>
              Laporan Resmi · {new Date(data.generatedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Tim</Text>
            <Text style={styles.statValue}>{summary.totalTeams}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Observasi</Text>
            <Text style={styles.statValue}>{summary.totalObservations}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Dimensi Diukur</Text>
            <Text style={styles.statValue}>8</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Missions</Text>
            <Text style={styles.statValue}>5</Text>
          </View>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview Organisasi</Text>
          <Text style={styles.paragraph}>{narrative.overview}</Text>
        </View>

        {/* Strengths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Kekuatan Utama Organisasi</Text>
          {summary.topStrengths.map((dim, i) => (
            <View key={dim.dimensionCode} style={styles.narrativeItem}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={[styles.rankBadge, { backgroundColor: getScoreColor(dim.score) }]}>
                    <Text style={{ fontSize: 8, fontWeight: 700, color: "#FFFFFF" }}>{i + 1}</Text>
                  </View>
                  <Text style={styles.dimensionName}>{dim.dimensionName}</Text>
                </View>
                <Text style={styles.scoreBadge}>{dim.score?.toFixed(1)} / 5.0</Text>
              </View>
              <ScoreBarPdf score={dim.score} />
              {narrative.strengthsNarrative[i] && (
                <Text style={[styles.narrativeText, { marginTop: 4 }]}>{narrative.strengthsNarrative[i]}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Development Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Area Pengembangan Utama</Text>
          {summary.developmentAreas.map((dim, i) => (
            <View key={dim.dimensionCode} style={styles.narrativeItem}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                  <View style={[styles.rankBadge, { backgroundColor: getScoreColor(dim.score) }]}>
                    <Text style={{ fontSize: 8, fontWeight: 700, color: "#FFFFFF" }}>{i + 1}</Text>
                  </View>
                  <Text style={styles.dimensionName}>{dim.dimensionName}</Text>
                </View>
                <Text style={styles.scoreBadge}>{dim.score?.toFixed(1)} / 5.0</Text>
              </View>
              <ScoreBarPdf score={dim.score} />
              {narrative.developmentNarrative[i] && (
                <Text style={[styles.narrativeText, { marginTop: 4 }]}>{narrative.developmentNarrative[i]}</Text>
              )}
            </View>
          ))}
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationBox}>
          <Text style={[styles.sectionTitle, { color: GOLD, borderBottomWidth: 0, marginBottom: 4, paddingBottom: 0 }]}>
            Rekomendasi Strategis Organisasi
          </Text>
          <Text style={styles.recommendationText}>{narrative.recommendation}</Text>
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BinaHub — Human-Centered Transformation Partner · Rahasia</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>
      </Page>

      {/* Page 2: Team Ranking & Scores */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Bina<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>T-BOS Team Ranking & Detail</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>Detail Skor per Tim</Text>
          </View>
        </View>

        {/* Team Ranking Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Peringkat Tim</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 24 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1.2 }]}>Nama Tim</Text>
            <Text style={[styles.tableHeaderCell, { width: 50 }]}>Batch</Text>
            <Text style={[styles.tableHeaderCell, { width: 45, textAlign: "center" }]}>Skor</Text>
            <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>Obs.</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Kekuatan Utama</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Area Dev.</Text>
          </View>
          {sortedTeams.map((team, i) => (
            <View key={team.teamId} style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={[styles.tableCell, { width: 24, fontWeight: 700, color: NAVY }]}>{i + 1}</Text>
              <Text style={[styles.tableCell, { flex: 1.2, fontWeight: 600 }]}>{team.teamName}</Text>
              <Text style={[styles.tableCell, { width: 50 }]}>{team.batch}</Text>
              <Text style={[styles.tableCell, { width: 45, textAlign: "center", fontWeight: 700, color: NAVY }]}>
                {team.overallTeamScore?.toFixed(1) ?? "-"}
              </Text>
              <Text style={[styles.tableCell, { width: 40, textAlign: "center" }]}>{team.totalObservations}</Text>
              <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>
                {team.strongestDimension?.dimensionName ?? "-"}
              </Text>
              <Text style={[styles.tableCell, { flex: 1, fontSize: 8 }]}>
                {team.weakestDimension?.dimensionName ?? "-"}
              </Text>
            </View>
          ))}
        </View>

        {/* Dimension Scores per Team */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rincian Skor Dimensi per Tim</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tim</Text>
            {teams[0]?.dimensionAverages.map((d) => (
              <Text key={d.dimensionCode} style={[styles.tableHeaderCell, { width: 48, textAlign: "center", fontSize: 6.5 }]}>
                {d.dimensionName.split(" ").map(w => w[0]).join("")}
              </Text>
            ))}
            <Text style={[styles.tableHeaderCell, { width: 36, textAlign: "center" }]}>Avg</Text>
          </View>
          {sortedTeams.map((team, idx) => {
            const validScores = team.dimensionAverages.filter((d) => d.score !== null);
            const avg = validScores.length > 0
              ? (validScores.reduce((s, d) => s + (d.score || 0), 0) / validScores.length).toFixed(1)
              : "-";
            return (
              <View key={team.teamId} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1, fontWeight: 600 }]}>{team.teamName}</Text>
                {team.dimensionAverages.map((d) => (
                  <Text
                    key={d.dimensionCode}
                    style={[styles.tableCell, { width: 48, textAlign: "center", fontWeight: 700, color: getScoreColor(d.score) }]}
                  >
                    {d.score !== null ? d.score.toFixed(1) : "—"}
                  </Text>
                ))}
                <Text style={[styles.tableCell, { width: 36, textAlign: "center", fontWeight: 700, color: NAVY }]}>
                  {avg}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BinaHub — Human-Centered Transformation Partner · Rahasia</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>
      </Page>

      {/* Page 3: Batch Comparison */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Bina<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>Batch Comparison Analysis</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>Perbandingan Batch 1 vs 2</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Analisis Rata-rata Skor Dimensi per Batch</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Dimensi Perilaku</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Batch 1</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Batch 2</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Selisih</Text>
          </View>
          {batchComparisons.map((bc, idx) => {
            const diff = bc.batch1Avg !== null && bc.batch2Avg !== null ? bc.batch2Avg - bc.batch1Avg : null;
            return (
              <View key={bc.dimensionCode} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
                <Text style={[styles.tableCell, { flex: 1, fontWeight: 600 }]}>{bc.dimensionName}</Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 700, color: NAVY }]}>
                  {bc.batch1Avg !== null ? bc.batch1Avg.toFixed(1) : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 700, color: GOLD }]}>
                  {bc.batch2Avg !== null ? bc.batch2Avg.toFixed(1) : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 700, color: diff !== null && diff > 0 ? "#10B981" : diff !== null && diff < 0 ? "#EF4444" : TEXT_MUTED }]}>
                  {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` : "—"}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>BinaHub — Human-Centered Transformation Partner · Rahasia</Text>
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} dari ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export { TbosReportDocument };

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
const LIGHT_BG = "#F5F7FA";
const BORDER = "#E2E8F0";
const TEXT_DARK = "#1A1A2E";
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
    padding: 40,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingBottom: 16,
    marginBottom: 24,
    borderBottom: `3px solid ${GOLD}`,
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
  },
  reportMeta: {
    textAlign: "right",
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: NAVY,
  },
  reportDate: {
    fontSize: 8,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottom: `1px solid ${BORDER}`,
  },
  paragraph: {
    fontSize: 9,
    lineHeight: 1.6,
    color: TEXT_MUTED,
  },
  statRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: LIGHT_BG,
    borderRadius: 8,
    padding: 12,
  },
  statLabel: {
    fontSize: 7,
    color: TEXT_MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 700,
    color: NAVY,
  },
  dimensionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottom: `1px solid ${BORDER}`,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  dimensionName: {
    flex: 1,
    fontSize: 9,
    fontWeight: 500,
    color: TEXT_DARK,
  },
  scoreBadge: {
    fontSize: 11,
    fontWeight: 700,
    color: NAVY,
  },
  narrative: {
    fontSize: 9,
    lineHeight: 1.6,
    color: TEXT_MUTED,
    marginBottom: 8,
  },
  recommendationBox: {
    backgroundColor: NAVY,
    borderRadius: 8,
    padding: 16,
    marginTop: 12,
  },
  recommendationText: {
    fontSize: 9,
    lineHeight: 1.6,
    color: "#FFFFFF",
    opacity: 0.85,
  },
  teamTable: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: `2px solid ${NAVY}`,
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 600,
    color: NAVY,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 6,
    borderBottom: `1px solid ${BORDER}`,
  },
  tableCell: {
    fontSize: 9,
    color: TEXT_DARK,
  },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1px solid ${BORDER}`,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
  pageNumber: {
    fontSize: 7,
    color: TEXT_MUTED,
  },
});

function getScoreColor(score: number | null): string {
  if (score === null) return "#CBD5E1";
  if (score >= 4.5) return "#16A34A";
  if (score >= 3.5) return "#65A30D";
  if (score >= 2.5) return "#CA8A04";
  if (score >= 1.5) return "#EA580C";
  return "#DC2626";
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
              {new Date(data.generatedAt).toLocaleDateString("id-ID", {
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
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.paragraph}>{narrative.overview}</Text>
        </View>

        {/* Strengths */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Kekuatan Utama</Text>
          {summary.topStrengths.map((dim, i) => (
            <View key={dim.dimensionCode} style={styles.dimensionRow}>
              <View style={[styles.rankBadge, { backgroundColor: getScoreColor(dim.score) }]}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>{i + 1}</Text>
              </View>
              <Text style={styles.dimensionName}>{dim.dimensionName}</Text>
              <Text style={styles.scoreBadge}>{dim.score?.toFixed(1)}/5</Text>
            </View>
          ))}
          {narrative.strengthsNarrative.map((text, i) => (
            <Text key={i} style={styles.narrative}>{text}</Text>
          ))}
        </View>

        {/* Development Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3 Area Pengembangan</Text>
          {summary.developmentAreas.map((dim, i) => (
            <View key={dim.dimensionCode} style={styles.dimensionRow}>
              <View style={[styles.rankBadge, { backgroundColor: getScoreColor(dim.score) }]}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: "#FFFFFF" }}>{i + 1}</Text>
              </View>
              <Text style={styles.dimensionName}>{dim.dimensionName}</Text>
              <Text style={styles.scoreBadge}>{dim.score?.toFixed(1)}/5</Text>
            </View>
          ))}
          {narrative.developmentNarrative.map((text, i) => (
            <Text key={i} style={styles.narrative}>{text}</Text>
          ))}
        </View>

        {/* Recommendation */}
        <View style={styles.recommendationBox}>
          <Text style={[styles.sectionTitle, { color: GOLD, borderBottom: "none", marginBottom: 6 }]}>
            Rekomendasi Strategis
          </Text>
          <Text style={styles.recommendationText}>{narrative.recommendation}</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BinaHub — Human-Centered Transformation Partner</Text>
          <Text style={styles.pageNumber}>Halaman 1</Text>
        </View>
      </Page>

      {/* Page 2: Team Ranking & Scores */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Bina<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>T-BOS Team Ranking</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>Detail Skor per Tim</Text>
          </View>
        </View>

        {/* Team Ranking Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ranking Tim</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: 30 }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tim</Text>
            <Text style={[styles.tableHeaderCell, { width: 60 }]}>Batch</Text>
            <Text style={[styles.tableHeaderCell, { width: 50, textAlign: "center" }]}>Skor</Text>
            <Text style={[styles.tableHeaderCell, { width: 50, textAlign: "center" }]}>Obs.</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Kekuatan</Text>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Area Dev.</Text>
          </View>
          {sortedTeams.map((team, i) => (
            <View key={team.teamId} style={styles.tableRow}>
              <Text style={[styles.tableCell, { width: 30, fontWeight: 700, color: NAVY }]}>{i + 1}</Text>
              <Text style={[styles.tableCell, { flex: 1, fontWeight: 500 }]}>{team.teamName}</Text>
              <Text style={[styles.tableCell, { width: 60 }]}>{team.batch}</Text>
              <Text style={[styles.tableCell, { width: 50, textAlign: "center", fontWeight: 700, color: NAVY }]}>
                {team.overallTeamScore?.toFixed(1) ?? "-"}
              </Text>
              <Text style={[styles.tableCell, { width: 50, textAlign: "center" }]}>{team.totalObservations}</Text>
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
          <Text style={styles.sectionTitle}>Skor per Dimensi per Tim</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Tim</Text>
            {teams[0]?.dimensionAverages.map((d) => (
              <Text key={d.dimensionCode} style={[styles.tableHeaderCell, { width: 50, textAlign: "center", fontSize: 6 }]}>
                {d.dimensionName.split(" ").map(w => w[0]).join("")}
              </Text>
            ))}
            <Text style={[styles.tableHeaderCell, { width: 40, textAlign: "center" }]}>Avg</Text>
          </View>
          {sortedTeams.map((team) => {
            const validScores = team.dimensionAverages.filter((d) => d.score !== null);
            const avg = validScores.length > 0
              ? (validScores.reduce((s, d) => s + (d.score || 0), 0) / validScores.length).toFixed(1)
              : "-";
            return (
              <View key={team.teamId} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, fontWeight: 500 }]}>{team.teamName}</Text>
                {team.dimensionAverages.map((d) => (
                  <Text
                    key={d.dimensionCode}
                    style={[styles.tableCell, { width: 50, textAlign: "center", fontWeight: 600, color: getScoreColor(d.score) }]}
                  >
                    {d.score !== null ? d.score.toFixed(1) : "—"}
                  </Text>
                ))}
                <Text style={[styles.tableCell, { width: 40, textAlign: "center", fontWeight: 700, color: NAVY }]}>
                  {avg}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BinaHub — Confidential</Text>
          <Text style={styles.pageNumber}>Halaman 2</Text>
        </View>
      </Page>

      {/* Page 3: Batch Comparison */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Bina<Text style={styles.logoAccent}>Hub</Text>
            </Text>
            <Text style={styles.tagline}>Batch Comparison</Text>
          </View>
          <View style={styles.reportMeta}>
            <Text style={styles.reportTitle}>Perbandingan Batch 1 vs Batch 2</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rata-rata Skor per Dimensi per Batch</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Dimensi</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Batch 1</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Batch 2</Text>
            <Text style={[styles.tableHeaderCell, { width: 70, textAlign: "center" }]}>Selisih</Text>
          </View>
          {batchComparisons.map((bc) => {
            const diff = bc.batch1Avg !== null && bc.batch2Avg !== null ? bc.batch2Avg - bc.batch1Avg : null;
            return (
              <View key={bc.dimensionCode} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 1, fontWeight: 500 }]}>{bc.dimensionName}</Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 600, color: NAVY }]}>
                  {bc.batch1Avg !== null ? bc.batch1Avg.toFixed(1) : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 600, color: GOLD }]}>
                  {bc.batch2Avg !== null ? bc.batch2Avg.toFixed(1) : "—"}
                </Text>
                <Text style={[styles.tableCell, { width: 70, textAlign: "center", fontWeight: 600, color: diff !== null && diff > 0 ? "#16A34A" : diff !== null && diff < 0 ? "#DC2626" : TEXT_MUTED }]}>
                  {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}` : "—"}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>BinaHub — Confidential</Text>
          <Text style={styles.pageNumber}>Halaman 3</Text>
        </View>
      </Page>
    </Document>
  );
}

export { TbosReportDocument };

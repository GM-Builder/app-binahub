"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Crown,
  Eye,
  Info,
  Loader2,
  RefreshCw,
  Trash2,
  UserPlus,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { FacilitatorAuthGate } from "@/components/facilitator-auth-gate";
import { TbosProgramSelector } from "@/components/tbos-program-selector";
import { ConfirmDialog } from "@/components/ui";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import type { LevelValue } from "@/modules/tbos";
import {
  fetchMissions,
  fetchFacilitatorMissionSelection,
  fetchTeams,
  flushQueuedObservations,
  getQueuedObservations,
  loadDraft,
  queueObservation,
  saveDraft,
  selectFacilitatorMission,
  submitObservation,
  type TbosDbMission,
  type TbosDbTeam,
  type TbosObservationMemberInput,
} from "@/modules/tbos/api-client";

type Step = "tasks" | "prepare" | "observe" | "review" | "submitting" | "done";
type TeamMember = { id: string; member_name: string; is_captain: boolean; isPresent: boolean };

// Satu token warna skala 1-5 (Reactive → Exemplary) dipakai konsisten di semua
// layar: selector level, badge skor Tinjau & Simpan. Status non-skor (hadir,
// selesai, dsb.) memakai warna netral — jangan mencampur dengan skala ini.
const LEVEL_COLORS: Record<number, { chip: string; chipActive: string; badge: string }> = {
  1: { chip: "border-rose-200 text-rose-700", chipActive: "border-rose-500 bg-rose-500 text-white", badge: "border-rose-200 bg-rose-50 text-rose-700" },
  2: { chip: "border-orange-200 text-orange-700", chipActive: "border-orange-500 bg-orange-500 text-white", badge: "border-orange-200 bg-orange-50 text-orange-700" },
  3: { chip: "border-amber-200 text-amber-700", chipActive: "border-amber-500 bg-amber-500 text-white", badge: "border-amber-200 bg-amber-50 text-amber-800" },
  4: { chip: "border-lime-300 text-lime-700", chipActive: "border-lime-500 bg-lime-500 text-white", badge: "border-lime-200 bg-lime-50 text-lime-700" },
  5: { chip: "border-green-300 text-green-700", chipActive: "border-green-600 bg-green-600 text-white", badge: "border-green-200 bg-green-50 text-green-700" },
};

const levelColors = (value: number | undefined) => LEVEL_COLORS[value || 0] || LEVEL_COLORS[3];

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export default function TbosObservationPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell
        role="facilitator"
        navigation="tbos"
        compactHeader
        title="Observasi T-BOS"
        eyebrow="Area Fasilitator"
      >
        <TbosObservationContent />
      </AppShell>
    </FacilitatorAuthGate>
  );
}

function TbosObservationContent() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("tasks");
  const [missions, setMissions] = useState<TbosDbMission[]>([]);
  const [teams, setTeams] = useState<TbosDbTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<TbosDbTeam | null>(null);
  const [selectedMission, setSelectedMission] = useState<TbosDbMission | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [sessionCaptainId, setSessionCaptainId] = useState<string | null>(null);
  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [memberError, setMemberError] = useState("");
  const [scores, setScores] = useState<Record<string, LevelValue>>({});
  const [notes, setNotes] = useState("");
  const [isOnline, setIsOnline] = useState(() => typeof navigator === "undefined" || navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);
  const [savedLocally, setSavedLocally] = useState(false);
  const [canEditRoster, setCanEditRoster] = useState(false);
  const [missionSelectionTarget, setMissionSelectionTarget] = useState<TbosDbMission | null>(null);
  const [lockingMission, setLockingMission] = useState(false);
  const [memberDeleteTarget, setMemberDeleteTarget] = useState<TeamMember | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState("");
  // Accordion state for the assess screen: dimension id -> collapsed or not.
  const [collapsedDimensions, setCollapsedDimensions] = useState<Set<string>>(new Set());
  const dimensionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const initData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id || "";
      setUserId(currentUserId);
      setUserName(
        sessionData.session?.user?.user_metadata?.full_name ||
        (sessionData.session?.user?.email || "").split("@")[0] ||
        currentUserId,
      );
      setQueuedCount(getQueuedObservations(currentUserId).length);

      if (!selectedProgramId) {
        setMissions([]);
        setTeams([]);
        setSelectedMission(null);
        return;
      }

      const [selection, missionList, teamList] = await Promise.all([
        fetchFacilitatorMissionSelection(selectedProgramId),
        fetchMissions(selectedProgramId),
        fetchTeams(selectedProgramId),
      ]);
      setMissions(missionList);
      setTeams(teamList);
      setSelectedMission(selection.selectedMissionId
        ? missionList.find((mission) => mission.id === selection.selectedMissionId) || null
        : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memuat penugasan.");
    } finally {
      setLoading(false);
    }
  }, [selectedProgramId]);

  useEffect(() => {
    void Promise.resolve().then(initData);
  }, [initData]);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const { data } = await supabase.auth.getSession();
      if (data.session?.user.id) {
        await flushQueuedObservations(data.session.user.id);
        setQueuedCount(getQueuedObservations(data.session.user.id).length);
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const prepareTeam = async (team: TbosDbTeam) => {
    if (team.observation) {
      toast.info(`${team.name} sudah selesai dinilai pada pos ini.`);
      return;
    }
    setSelectedTeam(team);
    setScores({});
    setNotes("");
    setMemberError("");
    setMembersLoading(true);
    setStep("prepare");

    try {
      const response = await fetch(`/api/tbos/teams/members?teamId=${encodeURIComponent(team.id)}`);
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !Array.isArray(result.members)) {
        throw new Error(result.error || "Gagal memuat anggota tim.");
      }
      const roster = result.members as Array<{
        id: string;
        member_name: string;
        is_captain?: boolean;
      }>;
      setCanEditRoster(Boolean(result.canEditRoster));

      const members = roster.map((member) => ({
        id: member.id,
        member_name: member.member_name,
        is_captain: Boolean(member.is_captain),
        isPresent: true,
      }));
      setTeamMembers(members);
      setSessionCaptainId(members.find((member) => member.is_captain)?.id || null);
    } catch (err) {
      setTeamMembers([]);
      setSessionCaptainId(null);
      setCanEditRoster(false);
      setMemberError(err instanceof Error ? err.message : "Gagal memuat anggota tim.");
    } finally {
      setMembersLoading(false);
    }
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    setMemberError("");

    if (!selectedTeam) { setAddingMember(false); return; }

    try {
      const response = await fetch("/api/tbos/teams/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeam.id,
          memberName: newMemberName.trim(),
          isCaptain: teamMembers.length === 0,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success || !result.member) {
        throw new Error(result.error || "Gagal menambah anggota.");
      }
      const member: TeamMember = { ...result.member, is_captain: Boolean(result.member.is_captain), isPresent: true };
      setTeamMembers((current) => [...current, member]);
      setSessionCaptainId((current) => current || member.id);
      setNewMemberName("");
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Gagal menambah anggota.");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveMember = (member: TeamMember) => {
    setMemberDeleteTarget(member);
  };

  const confirmRemoveMember = async () => {
    if (!memberDeleteTarget) return;
    const member = memberDeleteTarget;
    setDeletingMember(true);
    setMemberError("");

    if (!selectedTeam) {
      setDeletingMember(false);
      return;
    }

    try {
      const response = await fetch(
        `/api/tbos/teams/members?teamId=${encodeURIComponent(selectedTeam.id)}&memberId=${encodeURIComponent(member.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menghapus anggota.");
      setTeamMembers((current) => current.filter((item) => item.id !== member.id));
      if (sessionCaptainId === member.id) setSessionCaptainId(null);
      toast.success("Anggota berhasil dihapus dari tim.");
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Gagal menghapus anggota.");
    } finally {
      setDeletingMember(false);
    }
  };

  const toggleAttendance = (memberId: string) => {
    setMemberError("");
    const member = teamMembers.find((item) => item.id === memberId);
    if (member?.is_captain) {
      setMemberError("Kapten tim wajib hadir pada sesi observasi.");
      return;
    }
    setTeamMembers((current) =>
      current.map((member) => member.id === memberId ? { ...member, isPresent: !member.isPresent } : member),
    );
  };

  const handleSetCaptain = async (member: TeamMember) => {
    if (!selectedTeam || !canEditRoster || member.is_captain) return;
    setMemberError("");
    const response = await fetch("/api/tbos/teams/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId: selectedTeam.id, memberId: member.id, isCaptain: true }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.success) {
      setMemberError(result.error || "Gagal menetapkan kapten tim.");
      return;
    }
    setTeamMembers((current) => current.map((item) => ({ ...item, is_captain: item.id === member.id })));
    setSessionCaptainId(member.id);
    toast.success(`${member.member_name} ditetapkan sebagai kapten tim.`);
  };

  const presentMembers = teamMembers.filter((member) => member.isPresent);
  const sessionCaptain = presentMembers.find((member) => member.id === sessionCaptainId) || null;
  const preparationValid = presentMembers.length > 0 && Boolean(sessionCaptain);

  const continueToObservation = () => {
    if (!selectedTeam || !selectedMission) return;
    const draft = loadDraft(selectedTeam.id, selectedMission.id);
    setScores(draft?.scores || {});
    setNotes(draft?.notes || "");
    // Collapse dimensions already scored in the draft; the rest stay expanded.
    const preScored = new Set(
      selectedMission.dimensions
        .filter((dimension) => draft?.scores?.[dimension.id] !== undefined)
        .map((dimension) => dimension.id),
    );
    setCollapsedDimensions(preScored);
    setStep("observe");
  };

  const handleScoreSelect = (dimensionId: string, level: LevelValue) => {
    const updated = { ...scores, [dimensionId]: level };
    setScores(updated);
    if (selectedTeam && selectedMission) saveDraft(selectedTeam.id, selectedMission.id, updated, notes);

    // Collapse the dimension that was just scored, then smooth-scroll to the
    // next unscored one. Manual upward scrolling is never overridden: we only
    // scroll when there is a next unscored dimension.
    if (selectedMission) {
      const remaining = selectedMission.dimensions.filter((dimension) => updated[dimension.id] === undefined);
      const next = remaining[0];
      setCollapsedDimensions((current) => new Set(current).add(dimensionId));
      if (next) {
        window.setTimeout(() => {
          dimensionRefs.current[next.id]?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 180);
      }
    }
  };

  const handleNotesChange = (value: string) => {
    const nextNotes = value.slice(0, 50);
    setNotes(nextNotes);
    if (selectedTeam && selectedMission) saveDraft(selectedTeam.id, selectedMission.id, scores, nextNotes);
  };

  const allDimensionsScored = selectedMission
    ? selectedMission.dimensions.every((dimension) => scores[dimension.id] !== undefined)
    : false;
  const scoredCount = selectedMission?.dimensions.filter((dimension) => scores[dimension.id] !== undefined).length || 0;

  const handleSubmit = async () => {
    if (!selectedMission || !allDimensionsScored || !preparationValid) return;
    if (!selectedTeam) return;
    setError("");
    setStep("submitting");

    const members: TbosObservationMemberInput[] = teamMembers.map((member) => ({
      teamMemberId: member.id,
      memberName: member.member_name,
      isPresent: member.isPresent,
      isCaptain: member.isPresent && member.id === sessionCaptainId,
    }));

    const basePayload = {
      missionId: selectedMission.id,
      clientSubmissionId: crypto.randomUUID(),
      profileId: userId,
      notes,
      scores: selectedMission.dimensions.map((dimension) => ({
        dimensionId: dimension.id,
        levelValue: scores[dimension.id],
      })),
      members,
    };
    const payload: Parameters<typeof queueObservation>[1] & { profileId: string } = {
      ...basePayload,
      teamId: selectedTeam.id,
      batch: selectedTeam.batch,
    };

    if (!navigator.onLine) {
      queueObservation(userId, payload);
      setQueuedCount(getQueuedObservations(userId).length);
      setSavedLocally(true);
      setStep("done");
      return;
    }

    const result = await submitObservation(payload);
    if (result.success) {
      setSavedLocally(false);
      setStep("done");
    } else if (result.retryable) {
      queueObservation(userId, payload);
      setQueuedCount(getQueuedObservations(userId).length);
      setSavedLocally(true);
      setStep("done");
    } else {
      setError(result.error || "Observasi ditolak. Periksa data lalu coba lagi.");
      setStep("review");
    }
  };

  const confirmMissionSelection = async () => {
    if (!missionSelectionTarget || !selectedProgramId) return;
    setLockingMission(true);
    setError("");
    const result = await selectFacilitatorMission({
      programId: selectedProgramId,
      missionId: missionSelectionTarget.id,
    });
    if (!result.success) {
      setError(result.error || "Gagal mengunci pilihan pos.");
      setLockingMission(false);
      setMissionSelectionTarget(null);
      return;
    }
    const lockedMission = missionSelectionTarget;
    setSelectedMission(lockedMission);
    setMissions([lockedMission]);
    setMissionSelectionTarget(null);
    setLockingMission(false);
    toast.success(`Pos ${lockedMission.name} berhasil dikunci sampai program selesai.`);
    const teamList = await fetchTeams(selectedProgramId).catch(() => null);
    if (teamList) setTeams(teamList);
  };

  const handleProgramChange = useCallback((programId: string) => {
    setSelectedProgramId(programId);
    setSelectedMission(null);
    setSelectedTeam(null);
    setTeamMembers([]);
    setCanEditRoster(false);
    setStep("tasks");
    setError("");
    setLoading(true);
  }, []);

  const refreshDashboard = async () => {
    if (!selectedProgramId || refreshing) return;
    setRefreshing(true);
    setError("");
    try {
      const [selection, missionList, teamList] = await Promise.all([
        fetchFacilitatorMissionSelection(selectedProgramId),
        fetchMissions(selectedProgramId),
        fetchTeams(selectedProgramId),
      ]);
      setMissions(missionList);
      setTeams(teamList);
      setSelectedMission(selection.selectedMissionId
        ? missionList.find((mission) => mission.id === selection.selectedMissionId) || null
        : null);
      toast.success("Data penugasan berhasil diperbarui.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui penugasan.");
    } finally {
      setRefreshing(false);
    }
  };

  const resetForm = async () => {
    setLoading(true);
    setError("");
    try {
      const [selection, missionList, teamList] = await Promise.all([
        fetchFacilitatorMissionSelection(selectedProgramId),
        fetchMissions(selectedProgramId),
        fetchTeams(selectedProgramId),
      ]);
      setMissions(missionList);
      setTeams(teamList);
      setSelectedMission(selection.selectedMissionId
        ? missionList.find((mission) => mission.id === selection.selectedMissionId) || null
        : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui penugasan.");
    } finally {
      setLoading(false);
      setStep("tasks");
      setSelectedTeam(null);
      setTeamMembers([]);
      setCanEditRoster(false);
      setSessionCaptainId(null);
      setScores({});
      setNotes("");
    }
  };

  const completedTeamCount = teams.filter((team) => Boolean(team.observation)).length;
  const pendingTeamCount = teams.length - completedTeamCount;

  if (loading) {
    return (
      <Shell isOnline={isOnline} queuedCount={queuedCount}>
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <TbosProgramSelector value={selectedProgramId} onChange={handleProgramChange} />
        </div>
        <div className="flex min-h-[65vh] flex-col items-center justify-center gap-3" role="status">
          <Loader2 className="h-9 w-9 animate-spin text-[#0B2C6B] motion-reduce:animate-none" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-600">Memuat penugasan lapangan...</p>
        </div>
      </Shell>
    );
  }

  if (step === "done") {
    return (
      <Shell isOnline={isOnline} queuedCount={queuedCount}>
        <main className="mx-auto flex min-h-[75vh] max-w-lg items-center px-4 py-10">
          <section className="w-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(8,29,66,0.14)]" role="status">
            <div className="relative overflow-hidden bg-primary-dark px-6 py-10 text-center text-white">
              <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#17447F]" />
              <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full border-[22px] border-accent/20" />
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary-dark shadow-lg">
                {savedLocally ? <WifiOff className="h-8 w-8" /> : <Check className="h-8 w-8" />}
              </div>
              <h1 className="relative text-2xl font-bold tracking-tight">
                {savedLocally ? "Tersimpan sementara" : "Observasi selesai"}
              </h1>
              <p className="relative mt-2 text-sm text-white/70">
                {savedLocally ? "Data akan dikirim otomatis saat perangkat kembali online." : "Penilaian tim pada pos Anda telah tersimpan."}
              </p>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-accent/30 bg-[#F7F6F2] p-4">
                <p className="font-bold text-[#0B2C6B]">{selectedTeam?.name || "Tim"}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedMission?.name}</p>
              </div>
              <button type="button" onClick={() => void resetForm()} className={`flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B2C6B] px-4 font-bold text-white shadow-lg shadow-[#0B2C6B]/20 ${FOCUS}`}>
                Kembali ke Daftar Tim
              </button>
              <button type="button" onClick={() => router.push("/fasilitator/tbos/observations")} className={`flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-200 font-semibold text-slate-700 ${FOCUS}`}>
                Lihat Hasil Observasi
              </button>
            </div>
          </section>
        </main>
      </Shell>
    );
  }

  return (
    <Shell isOnline={isOnline} queuedCount={queuedCount}>
      {step === "tasks" && (
        <main className="pb-[calc(7rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex max-w-3xl flex-col gap-2 px-4 sm:flex-row sm:items-end sm:justify-between">
            <TbosProgramSelector value={selectedProgramId} onChange={handleProgramChange} />
            <button type="button" onClick={() => void refreshDashboard()} disabled={!selectedProgramId || refreshing} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-primary-dark disabled:opacity-50 ${FOCUS}`}>
              <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              {refreshing ? "Memperbarui..." : "Perbarui data"}
            </button>
          </div>

          {/* Header ringkas: sapaan + pos observasi + status online dalam satu blok */}
          <section className="mx-auto mt-3 max-w-3xl px-4" aria-label="Konteks penugasan">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3.5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="truncate text-lg font-bold tracking-[-0.02em] text-[#0B2C6B]">Halo, {userName || "Fasilitator"}</h1>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {selectedMission
                      ? <>Pos: <span className="font-semibold text-[#0B2C6B]">{selectedMission.name}</span> · {selectedMission.dimensions.length} dimensi dinilai</>
                      : "Pos observasi belum dipilih"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5 text-xs font-semibold" aria-label={isOnline ? "Perangkat online" : "Perangkat offline"}>
                  <span className={`h-2 w-2 rounded-full ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} aria-hidden="true" />
                  <span className={isOnline ? "text-slate-600" : "text-amber-700"}>{isOnline ? "Online" : "Offline"}</span>
                  {queuedCount > 0 && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">{queuedCount} antrean</span>}
                </div>
              </div>
              {selectedMission && (
                <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  Pos Anda untuk program ini. Pilih misi berbeda tidak tersedia sampai program selesai.
                </p>
              )}
            </div>
          </section>

          <section className="mx-auto mt-3 max-w-3xl space-y-3 px-4" aria-labelledby="assigned-teams-title">
            {!selectedMission && missions.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)]">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9A7B2F]">Pilih pos observasi</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {missions.map((mission) => (
                    <button key={mission.id} type="button" onClick={() => setMissionSelectionTarget(mission)} className={`group min-h-16 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-[#D9A441] hover:bg-[#FFF9EA] ${FOCUS}`}>
                      <span className="block text-sm font-bold text-primary-dark">{mission.name}</span>
                      <span className="mt-1 block text-xs text-slate-500">{mission.dimensions.length} dimensi penilaian</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {missions.length === 0 && <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-800">Belum ada misi T-BOS yang tersedia. Hubungi admin program.</p>}

            {selectedMission && (
              <div className="grid grid-cols-3 gap-2 sm:gap-3" aria-label="Kemajuan observasi tim">
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</p><p className="mt-1 text-2xl font-extrabold text-primary-dark">{teams.length}</p><p className="text-xs text-slate-500">tim</p></div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">Belum dinilai</p><p className="mt-1 text-2xl font-extrabold text-amber-800">{pendingTeamCount}</p><p className="text-xs text-amber-700">tim</p></div>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 sm:p-4"><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Selesai</p><p className="mt-1 text-2xl font-extrabold text-emerald-800">{completedTeamCount}</p><p className="text-xs text-emerald-700">tim</p></div>
              </div>
            )}

            <div className="flex items-end justify-between gap-3 pt-1">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#B47B13]">Daftar tim</p>
                <h2 id="assigned-teams-title" className="mt-1 text-lg font-bold text-primary-dark">{selectedMission ? "Pilih tim berikutnya" : "Daftar tim belum dibuka"}</h2>
              </div>
              {selectedMission && completedTeamCount > 0 && (
                <button type="button" onClick={() => router.push("/fasilitator/tbos/observations")} className={`inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-primary-dark ${FOCUS}`}>
                  <Eye className="h-3.5 w-3.5" aria-hidden="true" /> Lihat semua hasil
                </button>
              )}
            </div>

            {error && <Alert>{error}</Alert>}
            {selectedMission && teams.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
                <p className="font-semibold text-primary-dark">Belum ada tim dalam program</p>
                <p className="mt-1 text-sm text-slate-500">Hubungi admin program untuk menambahkan tim.</p>
              </div>
            )}
            {selectedMission && [...teams].sort((a, b) => Number(Boolean(a.observation)) - Number(Boolean(b.observation))).map((team, index) => {
              const completed = Boolean(team.observation);
              const captain = team.members?.find((member) => member.is_captain);
              return (
                <article key={team.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)] sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${completed ? "bg-emerald-100 text-emerald-700" : "bg-[#FFF4D6] text-[#9A6A12]"}`} aria-hidden="true">
                      {completed ? <Check className="h-5 w-5" /> : String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-primary-dark sm:text-lg">{team.name}</h3>
                        <span className="rounded-full bg-primary-dark/[0.06] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-dark">{team.batch}</span>
                        {completed && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Selesai</span>}
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {team.members?.length || 0} anggota · Kapten: {captain?.member_name || "belum ditentukan"}
                        {completed && team.observation ? ` · Selesai ${new Date(team.observation.submittedAt).toLocaleString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3.5 border-t border-slate-100 pt-3.5">
                    {completed ? (
                      <button type="button" onClick={() => router.push("/fasilitator/tbos/observations")} className={`flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white text-sm font-bold text-emerald-700 ${FOCUS}`}>
                        <Eye className="h-4 w-4" aria-hidden="true" /> Lihat hasil
                      </button>
                    ) : (
                      <button type="button" onClick={() => void prepareTeam(team)} className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-dark px-4 text-sm font-bold text-white shadow-md shadow-primary-dark/15 ${FOCUS}`}>
                        Mulai observasi <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
                </main>
      )}

{step === "prepare" && selectedTeam && (
        <WorkflowPage
          stepIndex={1}
          title="Siapkan tim"
          subtitle={`${selectedTeam.name} · ${selectedTeam.batch}`}
          backLabel="Kembali ke daftar tim"
          onBack={() => setStep("tasks")}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} />}
        >
           <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.06)]" aria-labelledby="attendance-title">
             <div className="flex items-start justify-between gap-3">
               <div>
                 <h2 id="attendance-title" className="text-lg font-bold text-primary-dark">Anggota yang hadir</h2>
                 <div className="mt-1 flex items-center gap-1.5">
                   <p className="text-sm text-slate-500">Diisi fasilitator pertama, tidak bisa diubah setelah observasi pertama tersimpan.</p>
                   <span className="relative">
                     <button type="button" aria-label="Informasi pengisian daftar anggota" title="Informasi" onClick={(event) => { const tip = event.currentTarget.nextElementSibling; if (tip) tip.toggleAttribute("hidden"); }} className={`flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-slate-400 hover:border-[#0B2C6B]/30 hover:text-[#0B2C6B] ${FOCUS}`}>
                       <Info className="h-3.5 w-3.5" aria-hidden="true" />
                     </button>
                     <span hidden className="absolute left-0 top-7 z-20 block w-64 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 shadow-lg">
                       Daftar anggota dan kapten diisi oleh fasilitator pertama yang menerima tim. Setelah observasi pertama tersimpan, daftar ini tidak dapat diubah. Kapten tim wajib tercatat hadir dalam observasi.
                     </span>
                   </span>
                 </div>
               </div>
               <Users className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
             </div>

             {memberError && <div className="mt-4"><Alert>{memberError}</Alert></div>}
             {membersLoading ? (
               <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500" role="status">
                 <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" /> Memuat anggota tim...
               </div>
             ) : (
               <div className="mt-5 space-y-2.5">
                 {teamMembers.length === 0 && <p className="rounded-2xl bg-[#F7F6F2] p-4 text-sm text-slate-500">Daftar anggota masih kosong. Tambahkan seluruh anggota tim, lalu tentukan kapten.</p>}
                 {teamMembers.map((member) => {
                   const isSessionCaptain = member.isPresent && sessionCaptainId === member.id;
                   return (
                     <article key={member.id} className="rounded-xl border border-slate-200 bg-white p-3">
                       <div className="flex items-center gap-3">
                         <button
                           type="button"
                           role="switch"
                           aria-checked={member.isPresent}
                           aria-label={`${member.member_name} ${member.isPresent ? "hadir" : "tidak hadir"}`}
                           onClick={() => toggleAttendance(member.id)}
                           className={`relative h-11 w-14 shrink-0 rounded-full transition-colors motion-reduce:transition-none ${member.isPresent ? "bg-[#0B2C6B]" : "bg-slate-300"} ${FOCUS}`}
                         >
                            <span
                              className={`absolute left-1 top-1.5 h-8 w-8 rounded-full bg-white shadow transition-transform motion-reduce:transition-none ${member.isPresent ? "translate-x-4" : "translate-x-0"}`}
                              aria-hidden="true"
                            />
                         </button>
                         <div className="min-w-0 flex-1">
                           <div className="flex items-center gap-1.5">
                             <h3 className={`truncate text-sm font-bold ${member.isPresent ? "text-slate-800" : "text-slate-400"}`}>{member.member_name}</h3>
                             {isSessionCaptain && (
                               <span title="Kapten tim" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#FFF4D6] px-1.5 py-0.5 text-[10px] font-bold text-[#9A6A12]">
                                 <Crown className="h-3 w-3" aria-hidden="true" /> Kapten
                               </span>
                             )}
                           </div>
                           <p className="mt-0.5 text-xs text-slate-500">{member.isPresent ? "Hadir" : "Tidak hadir"}</p>
                         </div>
                        <button
                          type="button"
                          disabled={!canEditRoster || !member.isPresent || member.is_captain}
                          aria-pressed={isSessionCaptain}
                          aria-label={`Tetapkan ${member.member_name} sebagai kapten tim`}
                          onClick={() => void handleSetCaptain(member)}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-30 ${isSessionCaptain ? "border-accent bg-accent text-primary-dark" : "border-slate-200 text-slate-400"} ${FOCUS}`}
                        >
                          <Crown className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {canEditRoster && !member.is_captain && (
                          <button type="button" onClick={() => handleRemoveMember(member)} aria-label={`Hapus ${member.member_name} dari daftar anggota`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 ${FOCUS}`}>
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {canEditRoster ? <form onSubmit={handleAddMember} className="mt-5 border-t border-slate-100 pt-5">
              <label htmlFor="new-member" className="text-sm font-bold text-[#0B2C6B]">Tambah anggota tim</label>
              <div className="mt-2 flex gap-2">
                <input id="new-member" type="text" value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} placeholder="Nama anggota" className={`min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F7F6F2] px-3 text-sm text-slate-800 placeholder:text-slate-400 ${FOCUS}`} />
                <button type="submit" disabled={!newMemberName.trim() || addingMember} aria-label="Tambah anggota tim" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2C6B] text-white disabled:opacity-40 ${FOCUS}`}>
                  {addingMember ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <UserPlus className="h-4 w-4" />}
                </button>
              </div>
            </form> : (
              <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">Daftar anggota sudah tersedia. Tandai kehadiran, lalu lanjutkan penilaian pada pos Anda.</p>
            )}
           </section>

          <BottomAction disabled={!preparationValid || membersLoading} onClick={continueToObservation} label="Lanjut ke Penilaian" />
        </WorkflowPage>
      )}

{step === "observe" && selectedTeam && selectedMission && (
        <WorkflowPage
          stepIndex={2}
          title="Nilai perilaku tim"
          subtitle={`${selectedTeam.name} · ${selectedMission.name}`}
          backLabel="Kembali ke persiapan tim"
          onBack={() => setStep("prepare")}
          status={<span className="text-xs font-bold text-[#0B2C6B]">{scoredCount}/{selectedMission.dimensions.length}</span>}
          progress={{ current: scoredCount, total: selectedMission.dimensions.length }}
        >
          <div className="space-y-3">
            {selectedMission.dimensions.map((dimension, index) => {
              const selectedLevel = scores[dimension.id];
              const collapsed = collapsedDimensions.has(dimension.id) && selectedLevel !== undefined;
              const selectedLevelData = dimension.levels.find((level) => level.level_value === selectedLevel);
              return (
                <div
                  key={dimension.id}
                  ref={(node) => { dimensionRefs.current[dimension.id] = node; }}
                  className="scroll-mt-4"
                >
                  {collapsed ? (
                    <button
                      type="button"
                      aria-expanded={false}
                      onClick={() => setCollapsedDimensions((current) => { const next = new Set(current); next.delete(dimension.id); return next; })}
                      className={`flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-left shadow-[0_8px_24px_rgba(8,29,66,0.04)] transition hover:border-[#0B2C6B]/25 ${FOCUS}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#0B2C6B]/[0.06] text-xs font-bold text-[#0B2C6B]" aria-hidden="true">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-[#0B2C6B]">{dimension.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{selectedLevelData?.level_label} — lihat detail</span>
                      </span>
                      <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-xs font-extrabold ${levelColors(selectedLevel).badge}`}>
                        {selectedLevelData?.level_label} ({selectedLevel})
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                    </button>
                  ) : (
                    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(8,29,66,0.05)] sm:p-5">
                      <legend className="sr-only">{dimension.name}</legend>
                      <div className="flex items-start gap-3">
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-bold ${selectedLevel ? "border-[#0B2C6B]/15 bg-[#0B2C6B]/[0.06] text-[#0B2C6B]" : "border-slate-200 bg-slate-50 text-slate-400"}`} aria-hidden="true">{index + 1}</span>
                        <div className="min-w-0">
                          <h2 className="font-bold text-[#0B2C6B]">{dimension.name}</h2>
                          <p className="mt-1 text-sm leading-relaxed text-slate-500">{dimension.question}</p>
                        </div>
                      </div>

                      <div
                        className="mt-4"
                        role="radiogroup"
                        aria-label={`Skor ${dimension.name}`}
                        onKeyDown={(event) => {
                          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
                          event.preventDefault();
                          const values = dimension.levels.map((level) => level.level_value);
                          const currentIndex = selectedLevel !== undefined ? values.indexOf(selectedLevel) : -1;
                          const offset = event.key === "ArrowRight" ? 1 : -1;
                          const nextIndex = currentIndex === -1
                            ? (offset === 1 ? 0 : values.length - 1)
                            : Math.min(Math.max(currentIndex + offset, 0), values.length - 1);
                          const nextLevel = dimension.levels[nextIndex];
                          if (nextLevel) handleScoreSelect(dimension.id, nextLevel.level_value as LevelValue);
                        }}
                      >
                        <div className="grid grid-cols-5 gap-1.5">
                          {dimension.levels.map((level) => {
                            const selected = selectedLevel === level.level_value;
                            const colors = levelColors(level.level_value);
                            return (
                              <button
                                key={level.level_value}
                                type="button"
                                role="radio"
                                aria-checked={selected}
                                tabIndex={selected || (selectedLevel === undefined && level.level_value === 1) ? 0 : -1}
                                aria-label={`${level.level_value} — ${level.level_label}`}
                                title={`${level.level_label}: ${level.description}`}
                                onClick={() => handleScoreSelect(dimension.id, level.level_value as LevelValue)}
                                className={`flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl border-2 py-2 transition-all duration-200 motion-reduce:transition-none ${selected ? colors.chipActive + " scale-[1.03] shadow-sm" : colors.chip + " bg-white hover:bg-slate-50"} ${FOCUS}`}
                              >
                                <span className="text-base font-extrabold leading-none">{level.level_value}</span>
                                <span className="px-1 text-center text-[9px] font-semibold leading-tight">{level.level_label}</span>
                              </button>
                            );
                          })}
                        </div>
                        {selectedLevelData && (
                          <p className="mt-2.5 rounded-lg bg-[#F7F6F2] px-3 py-2 text-xs leading-relaxed text-slate-600" aria-live="polite">
                            <span className="font-bold">{selectedLevelData.level_label}:</span> {selectedLevelData.description}
                          </p>
                        )}
                      </div>
                    </fieldset>
                  )}
                </div>
              );
            })}
          </div>

           <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]" aria-labelledby="notes-title">
            <div className="flex items-center justify-between gap-3">
              <label id="notes-title" htmlFor="observation-notes" className="font-bold text-primary-dark">Catatan observasi <span className="font-normal text-slate-400">(opsional)</span></label>
              <span className="text-xs font-bold tabular-nums text-slate-500" aria-live="polite">{notes.length}/50</span>
            </div>
            <textarea id="observation-notes" value={notes} maxLength={50} rows={3} onChange={(event) => handleNotesChange(event.target.value)} placeholder="Contoh: Tim mengubah strategi setelah twist." className={`mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-[#F7F6F2] p-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 ${FOCUS}`} />
          </section>

          <BottomAction disabled={!allDimensionsScored} onClick={() => setStep("review")} label={allDimensionsScored ? "Tinjau Observasi" : `${scoredCount}/${selectedMission.dimensions.length} Dimensi Dinilai`} />
        </WorkflowPage>
      )}

{step === "review" && selectedTeam && selectedMission && sessionCaptain && (
        <WorkflowPage
          stepIndex={3}
          title="Tinjau dan simpan"
          subtitle="Pastikan daftar hadir, skor, dan catatan sudah tepat sebelum disimpan."
          backLabel="Kembali mengedit skor observasi"
          onBack={() => setStep("observe")}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} />}
        >
          {error && <Alert>{error}</Alert>}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.06)]" aria-labelledby="review-context-title">
            <div className="border-b border-accent/40 bg-[#FFF9EA] p-5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#9A6A12]">Ringkasan observasi</p>
              <h2 id="review-context-title" className="mt-2 text-xl font-bold text-[#0B2C6B]">{selectedTeam.name}</h2>
              <p className="mt-1 text-sm text-slate-500">{selectedTeam.batch} · {selectedMission.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5">
              <div>
                <p className="text-xs text-slate-500">Hadir</p>
                <p className="mt-1 text-lg font-bold text-primary-dark">{presentMembers.length} anggota</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kapten sesi</p>
                <p className="mt-1 truncate text-sm font-bold text-primary-dark">{sessionCaptain.member_name}</p>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Daftar hadir</p>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Anggota yang hadir">
                  {presentMembers.map((member) => <li key={member.id} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">{member.member_name}{member.id === sessionCaptainId ? " · Kapten" : ""}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]" aria-labelledby="review-scores-title">
            <h2 id="review-scores-title" className="text-lg font-bold text-primary-dark">Skor dimensi</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              {selectedMission.dimensions.map((dimension) => {
                const value = scores[dimension.id];
                const level = dimension.levels.find((item) => item.level_value === value);
                return (
                  <div key={dimension.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <dd className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-extrabold ${levelColors(value).badge}`}>{value}</dd>
                    <div className="min-w-0">
                      <dt className="text-sm font-bold text-slate-800">{dimension.name}</dt>
                      <dd className="mt-0.5 text-xs text-slate-500">{level?.level_label}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.05)]" aria-labelledby="review-notes-title">
            <div className="flex items-center justify-between gap-3">
              <h2 id="review-notes-title" className="text-lg font-bold text-primary-dark">Catatan <span className="text-sm font-normal text-slate-400">(opsional)</span></h2>
              <span className="text-xs font-bold tabular-nums text-slate-400">{notes.length}/50</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{notes || "Tidak ada catatan."}</p>
          </section>
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-6px_24px_rgba(8,29,66,0.06)] backdrop-blur">
            <div className="mx-auto grid max-w-2xl grid-cols-[0.8fr_1.2fr] gap-2">
              <button type="button" onClick={() => setStep("observe")} className={`min-h-14 rounded-2xl border border-[#0B2C6B]/20 bg-[#F7F6F2] px-3 text-sm font-bold text-[#0B2C6B] transition-colors hover:border-[#0B2C6B]/35 hover:bg-white ${FOCUS}`}>Edit</button>
              <button type="button" onClick={() => void handleSubmit()} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0B2C6B] px-3 text-sm font-bold text-white shadow-lg shadow-[#0B2C6B]/20 transition hover:brightness-110 ${FOCUS}`}>Simpan observasi <Check className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </WorkflowPage>
      )}

      {step === "submitting" && (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center" role="status" aria-live="polite">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[#0B2C6B] shadow-xl shadow-[#0B2C6B]/20">
            <Loader2 className="h-8 w-8 animate-spin text-accent-light motion-reduce:animate-none" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-primary-dark">Menyimpan observasi</h2>
          <p className="mt-2 text-sm text-slate-500">Jangan tutup halaman sampai proses selesai.</p>
        </div>
      )}
      <ConfirmDialog
        open={!!memberDeleteTarget}
        onClose={() => { if (!deletingMember) setMemberDeleteTarget(null); }}
        onConfirm={confirmRemoveMember}
        title="Hapus Anggota Tim?"
        description={memberDeleteTarget ? `"${memberDeleteTarget.member_name}" akan dihapus dari daftar anggota tim.` : undefined}
        confirmLabel="Ya, Hapus"
        variant="danger"
        loading={deletingMember}
      />
      <ConfirmDialog
        open={!!missionSelectionTarget}
        onClose={() => { if (!lockingMission) setMissionSelectionTarget(null); }}
        onConfirm={confirmMissionSelection}
        title="Kunci Pos T-BOS?"
        description={missionSelectionTarget
          ? `Anda akan bertugas di ${missionSelectionTarget.name} dan menilai seluruh tim pada pos ini. Pilihan tidak dapat diubah sampai program selesai.`
          : undefined}
        confirmLabel="Ya, Kunci Pos"
        loading={lockingMission}
      />
    </Shell>
  );
}

function Shell({ children, isOnline, queuedCount }: { children: React.ReactNode; isOnline: boolean; queuedCount: number }) {
  return (
    <div className="text-slate-800">
      {children}
      <span className="sr-only" role="status" aria-live="polite">{isOnline ? "Perangkat online" : "Perangkat offline"}. {queuedCount} observasi dalam antrean.</span>
    </div>
  );
}

function WorkflowPage({ stepIndex, title, subtitle, backLabel, onBack, status, progress, children }: {
  stepIndex: 1 | 2 | 3;
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  status: React.ReactNode;
  progress?: { current: number; total: number };
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(8,29,66,0.06)]">
        <div className="h-1 bg-gradient-to-r from-[#0B2C6B] via-[#D9A441] to-[#0B2C6B]" aria-hidden="true" />
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} aria-label={backLabel} className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#F7F6F2] text-slate-600 transition-colors hover:border-[#0B2C6B]/25 hover:bg-white hover:text-[#0B2C6B] ${FOCUS}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {status}
          </div>
          <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9A7B2F]">Tahap {stepIndex} dari 3 · {WORKFLOW_STEPS[stepIndex - 1]}</p>
          <h1 className="mt-1 text-xl font-bold tracking-[-0.025em] text-[#0B2C6B] sm:text-2xl">{title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">{subtitle}</p>
          {progress && (
            <div className="mt-3" aria-label={`Kemajuan penilaian ${progress.current} dari ${progress.total} dimensi`}>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-gradient-to-r from-[#0B2C6B] to-[#D9A441] transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(progress.current / Math.max(progress.total, 1)) * 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-500" aria-live="polite">{progress.current} dari {progress.total} dimensi dinilai</p>
            </div>
          )}
          <WorkflowProgress current={stepIndex} />
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-4 pb-16">{children}</div>
    </div>
  );
}

const WORKFLOW_STEPS = ["Siapkan tim", "Nilai perilaku", "Tinjau & simpan"];

function WorkflowProgress({ current }: { current: 1 | 2 | 3 }) {
  return (
    <div className="mt-4 flex items-center gap-2" aria-label="Kemajuan langkah">
      {WORKFLOW_STEPS.map((label, index) => {
        const step = (index + 1) as 1 | 2 | 3;
        const isActive = step === current;
        const isDone = step < current;
        return (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className="flex items-center gap-2">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${isDone ? "bg-emerald-100 text-emerald-700" : isActive ? "bg-[#0B2C6B] text-white ring-2 ring-[#0B2C6B]/20" : "bg-slate-100 text-slate-400"}`} aria-hidden="true">
                {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={`hidden text-xs font-semibold sm:block ${isActive ? "text-[#0B2C6B]" : isDone ? "text-slate-600" : "text-slate-400"}`}>{label}</span>
            </div>
            {index < WORKFLOW_STEPS.length - 1 && (
              <span className={`h-0.5 flex-1 rounded-full ${isDone ? "bg-emerald-200" : "bg-slate-200"}`} aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NetworkBadge({ isOnline, queuedCount, dark = false }: { isOnline: boolean; queuedCount: number; dark?: boolean }) {
  return (
    <div className={`flex min-h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-bold ${dark ? "bg-white/10 text-white/75 ring-1 ring-white/10" : "bg-white text-slate-600"}`} aria-label={`${isOnline ? "Online" : "Offline"}${queuedCount ? `, ${queuedCount} antrean` : ""}`}>
      {isOnline ? <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" /> : <WifiOff className="h-3.5 w-3.5 text-accent-light" aria-hidden="true" />}
      <span>{isOnline ? "Online" : "Offline"}{queuedCount > 0 ? ` · ${queuedCount}` : ""}</span>
    </div>
  );
}

function Alert({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium leading-relaxed text-rose-700" role="alert">{children}</div>;
}

function BottomAction({ disabled, onClick, label }: { disabled: boolean; onClick: () => void; label: string }) {
  return (
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-6px_24px_rgba(8,29,66,0.06)] backdrop-blur">
      <button type="button" disabled={disabled} onClick={onClick} className={`mx-auto flex min-h-14 w-full max-w-2xl items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition motion-reduce:transition-none ${disabled ? "bg-slate-100 text-slate-400" : "bg-[#0B2C6B] text-white shadow-lg shadow-[#0B2C6B]/20 hover:brightness-110"} ${FOCUS}`}>
        {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

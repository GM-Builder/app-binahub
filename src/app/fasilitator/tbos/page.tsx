"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Crown,
  Loader2,
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
import { supabase } from "@/lib/supabase";
import type { LevelValue } from "@/modules/tbos";
import {
  fetchMissions,
  fetchObservations,
  fetchTeams,
  flushQueuedObservations,
  getQueuedObservations,
  loadDraft,
  queueObservation,
  saveDraft,
  submitObservation,
  type TbosDbMission,
  type TbosDbObservation,
  type TbosDbTeam,
  type TbosObservationMemberInput,
} from "@/modules/tbos/api-client";

type Step = "tasks" | "prepare" | "mission" | "observe" | "review" | "submitting" | "done";
type TeamMember = { id: string; member_name: string; is_captain: boolean; isPresent: boolean };

const LEVEL_STYLES: Record<number, string> = {
  1: "border-rose-300 bg-rose-50 text-rose-800",
  2: "border-orange-300 bg-orange-50 text-orange-800",
  3: "border-amber-300 bg-amber-50 text-amber-800",
  4: "border-teal-300 bg-teal-50 text-teal-800",
  5: "border-emerald-400 bg-emerald-50 text-emerald-900",
};

const FOCUS = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2";

export default function TbosObservationPage() {
  return (
    <FacilitatorAuthGate>
      <AppShell
        role="facilitator"
        navigation="tbos"
        title="Form Observasi T-BOS"
        eyebrow="Team Behavioral Observation System"
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
  const [observations, setObservations] = useState<TbosDbObservation[] | null>(null);
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
  const [isCreatingNewTeam, setIsCreatingNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamBatchId, setNewTeamBatchId] = useState("");
  const [batches, setBatches] = useState<Array<{ id: string; name: string }>>([]);

  const initData = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData.session?.user.id || "";
      setUserId(currentUserId);
      setQueuedCount(getQueuedObservations(currentUserId).length);

      if (!selectedProgramId) {
        setMissions([]);
        setTeams([]);
        setBatches([]);
        return;
      }

      const [missionList, teamList] = await Promise.all([fetchMissions(selectedProgramId), fetchTeams(selectedProgramId)]);
      setMissions(missionList);
      setTeams(teamList);

      if (selectedProgramId) {
        const { fetchBatches } = await import("@/modules/tbos/api-client");
        const batchList = await fetchBatches(selectedProgramId);
        setBatches(batchList);
      }

      // Completion data is useful context, but must never block field work.
      void fetchObservations(selectedProgramId).then(setObservations).catch(() => setObservations(null));
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
    setSelectedTeam(team);
    setSelectedMission(null);
    setScores({});
    setNotes("");
    setMemberError("");
    setMembersLoading(true);
    setIsCreatingNewTeam(false);
    setStep("prepare");

    try {
      let roster = team.members || [];
      if (roster.length === 0) {
        const response = await fetch(`/api/tbos/teams/members?teamId=${encodeURIComponent(team.id)}`);
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success || !Array.isArray(result.members)) {
          throw new Error(result.error || "Gagal memuat roster tim.");
        }
        roster = result.members;
      }

      const members = roster.map((member) => ({
        id: member.id,
        member_name: member.member_name,
        is_captain: Boolean(member.is_captain),
        isPresent: true,
      }));
      setTeamMembers(members);
      setSessionCaptainId(members.find((member) => member.is_captain)?.id || members[0]?.id || null);
    } catch (err) {
      setTeamMembers([]);
      setSessionCaptainId(null);
      setMemberError(err instanceof Error ? err.message : "Gagal memuat roster tim.");
    } finally {
      setMembersLoading(false);
    }
  };

  const startCreateNewTeam = () => {
    setIsCreatingNewTeam(true);
    setSelectedTeam(null);
    setSelectedMission(null);
    setScores({});
    setNotes("");
    setTeamMembers([]);
    setSessionCaptainId(null);
    setNewTeamName("");
    setNewTeamBatchId(batches[0]?.id || "");
    setStep("prepare");
  };

  const handleAddMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMemberName.trim()) return;
    setAddingMember(true);
    setMemberError("");

    if (isCreatingNewTeam) {
      const newMember: TeamMember = {
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        member_name: newMemberName.trim(),
        is_captain: teamMembers.length === 0,
        isPresent: true,
      };
      setTeamMembers((current) => [...current, newMember]);
      setSessionCaptainId((current) => current || newMember.id);
      setNewMemberName("");
      setAddingMember(false);
      return;
    }

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

  const handleRemoveMember = async (member: TeamMember) => {
    if (!window.confirm(`Hapus ${member.member_name} dari roster master tim?`)) return;
    setMemberError("");

    if (isCreatingNewTeam) {
      setTeamMembers((current) => current.filter((item) => item.id !== member.id));
      if (sessionCaptainId === member.id) setSessionCaptainId(null);
      return;
    }

    if (!selectedTeam) return;

    try {
      const response = await fetch(
        `/api/tbos/teams/members?teamId=${encodeURIComponent(selectedTeam.id)}&memberId=${encodeURIComponent(member.id)}`,
        { method: "DELETE" },
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.error || "Gagal menghapus anggota.");
      setTeamMembers((current) => current.filter((item) => item.id !== member.id));
      if (sessionCaptainId === member.id) setSessionCaptainId(null);
    } catch (err) {
      setMemberError(err instanceof Error ? err.message : "Gagal menghapus anggota.");
    }
  };

  const toggleAttendance = (memberId: string) => {
    setMemberError("");
    setTeamMembers((current) =>
      current.map((member) => member.id === memberId ? { ...member, isPresent: !member.isPresent } : member),
    );
    const member = teamMembers.find((item) => item.id === memberId);
    if (member?.isPresent && sessionCaptainId === memberId) {
      setSessionCaptainId(null);
      setMemberError("Kapten sesi ditandai tidak hadir. Pilih satu kapten dari anggota yang hadir.");
    }
  };

  const presentMembers = teamMembers.filter((member) => member.isPresent);
  const sessionCaptain = presentMembers.find((member) => member.id === sessionCaptainId) || null;
  const preparationValid = presentMembers.length > 0 && Boolean(sessionCaptain);

  const continueToMissions = () => {
    if (presentMembers.length === 0) {
      setMemberError("Tandai minimal satu anggota hadir untuk melanjutkan.");
      return;
    }
    if (!sessionCaptain) {
      setMemberError("Pilih tepat satu kapten sesi dari anggota yang hadir.");
      return;
    }
    setMemberError("");
    setStep("mission");
  };

  const continueToObservation = () => {
    if ((!selectedTeam && !isCreatingNewTeam) || !selectedMission) return;
    const draft = selectedTeam ? loadDraft(selectedTeam.id, selectedMission.id) : null;
    setScores(draft?.scores || {});
    setNotes(draft?.notes || "");
    setStep("observe");
  };

  const handleScoreSelect = (dimensionId: string, level: LevelValue) => {
    const updated = { ...scores, [dimensionId]: level };
    setScores(updated);
    if (selectedTeam && selectedMission) saveDraft(selectedTeam.id, selectedMission.id, updated, notes);
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
    if (!selectedTeam && !isCreatingNewTeam) return;
    if (isCreatingNewTeam && (!newTeamName.trim() || !newTeamBatchId || !selectedProgramId)) return;
    setError("");
    setStep("submitting");

    const members: TbosObservationMemberInput[] = teamMembers.map((member) => ({
      teamMemberId: isCreatingNewTeam ? null : member.id,
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
    const payload: Parameters<typeof queueObservation>[1] & { profileId: string } = isCreatingNewTeam
      ? {
          ...basePayload,
          newTeam: { name: newTeamName.trim(), batchId: newTeamBatchId, programId: selectedProgramId },
          batch: batches.find((batch) => batch.id === newTeamBatchId)?.name || "",
        }
      : { ...basePayload, teamId: selectedTeam!.id, batch: selectedTeam!.batch };

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

  const resetForm = async () => {
    setLoading(true);
    setError("");
    try {
      const [missionList, teamList, observationList] = await Promise.all([
        fetchMissions(selectedProgramId),
        fetchTeams(selectedProgramId),
        fetchObservations(selectedProgramId),
      ]);
      setMissions(missionList);
      setTeams(teamList);
      setObservations(observationList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal memperbarui penugasan.");
    } finally {
      setLoading(false);
      setStep("tasks");
      setSelectedTeam(null);
      setSelectedMission(null);
      setTeamMembers([]);
      setSessionCaptainId(null);
      setScores({});
      setNotes("");
    }
  };

  const completedMissionIds = (teamId: string) => new Set(
    (observations || [])
      .filter((observation) => observation.teamId === teamId && observation.status !== "draft")
      .map((observation) => observation.missionId),
  );

  if (loading) {
    return (
      <Shell isOnline={isOnline} queuedCount={queuedCount}>
        <div className="mx-auto max-w-2xl px-4 pt-4">
          <TbosProgramSelector value={selectedProgramId} onChange={setSelectedProgramId} />
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
          <section className="w-full overflow-hidden rounded-md bg-white shadow-[0_24px_70px_rgba(8,29,66,0.18)]" role="status">
            <div className="relative overflow-hidden bg-primary-dark px-6 py-10 text-center text-white">
              <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#17447F]" />
              <div className="absolute -bottom-16 -left-10 h-36 w-36 rounded-full border-[22px] border-accent/20" />
              <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-primary-dark shadow-lg">
                {savedLocally ? <WifiOff className="h-8 w-8" /> : <Check className="h-8 w-8" />}
              </div>
              <h1 className="relative text-2xl font-bold tracking-tight">
                {savedLocally ? "Tersimpan di perangkat" : "Observasi tersimpan"}
              </h1>
              <p className="relative mt-2 text-sm text-white/70">
                {savedLocally ? "Data masuk antrean dan akan dikirim saat kembali online." : "Snapshot sesi berhasil disimpan ke server."}
              </p>
            </div>
            <div className="space-y-5 p-6">
              <div className="rounded-2xl border border-accent/30 bg-[#F7F6F2] p-4">
                <p className="font-bold text-[#0B2C6B]">{selectedTeam?.name || newTeamName || "Tim Baru"}</p>
                <p className="mt-1 text-sm text-slate-600">{selectedMission?.name}</p>
              </div>
              <button type="button" onClick={() => void resetForm()} className={`flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0B2C6B] px-4 font-bold text-white shadow-lg shadow-[#0B2C6B]/20 ${FOCUS}`}>
                Kembali ke Penugasan
              </button>
              <button type="button" onClick={() => router.push("/fasilitator/tbos/observations")} className={`flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-200 font-semibold text-slate-700 ${FOCUS}`}>
                Lihat Riwayat
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
        <main>
          <div className="mx-auto max-w-2xl px-4 pt-4"><TbosProgramSelector value={selectedProgramId} onChange={setSelectedProgramId} /></div>
          <section className="relative overflow-hidden bg-primary-dark px-4 pb-14 pt-8 text-white">
            <div className="absolute -right-14 -top-20 h-60 w-60 rounded-full bg-[#123A72]" />
            <div className="absolute right-12 top-16 h-28 w-28 rounded-full border-[18px] border-accent/15" />
            <div className="relative mx-auto max-w-2xl">
              <div className="mb-8 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                    <ClipboardCheck className="h-5 w-5 text-accent-light" aria-hidden="true" />
                  </div>
                  <div>
                   <p className="font-sans text-xl font-extrabold tracking-[-0.04em]"><span className="text-white">Bina</span><span className="text-accent-light">Hub</span></p>
                    <p className="text-sm font-semibold text-white/75">T-BOS Field Console</p>
                  </div>
                </div>
                <NetworkBadge isOnline={isOnline} queuedCount={queuedCount} dark />
              </div>
              <p className="text-sm font-semibold text-accent-light">Penugasan hari ini</p>
              <h1 className="mt-2 max-w-md text-3xl font-bold leading-tight tracking-[-0.03em]">Mulai dari tim, catat sesi dengan yakin.</h1>
              <div className="mt-7 inline-flex items-end gap-3 rounded-2xl bg-white/10 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
                <strong className="text-3xl leading-none text-accent-light">{teams.length}</strong>
                <span className="pb-0.5 text-sm text-white/75">tim ditugaskan</span>
              </div>
            </div>
          </section>

          <section className="mx-auto -mt-7 max-w-2xl space-y-4 px-4 pb-[calc(7rem+env(safe-area-inset-bottom))]" aria-labelledby="assigned-teams-title">
            <div className="relative flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-[0_12px_34px_rgba(8,29,66,0.1)]">
              <div>
                <h2 id="assigned-teams-title" className="font-bold text-[#0B2C6B]">Tim Anda</h2>
                <p className="mt-0.5 text-xs text-slate-500">Pilih tim atau buat baru untuk observasi.</p>
              </div>
              <button
                type="button"
                onClick={startCreateNewTeam}
                className="inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-2 text-xs font-bold text-primary-dark hover:bg-accent-light transition-colors"
              >
                <UserPlus className="h-3.5 w-3.5" /> Buat Tim Baru
              </button>
            </div>

            {error && <Alert>{error}</Alert>}
            {teams.length === 0 && (
              <div className="rounded-md bg-white p-7 text-center shadow-sm">
                <p className="font-semibold text-[#0B2C6B]">Belum ada tim ditugaskan</p>
                <p className="mt-1 text-sm text-slate-500">Hubungi admin untuk mendapatkan assignment.</p>
              </div>
            )}
            {teams.map((team, index) => {
              const completedCount = completedMissionIds(team.id).size;
              const captain = team.members?.find((member) => member.is_captain);
              return (
                <article key={team.id} className={`rounded-md border border-black/[0.04] bg-white p-5 ${index % 2 === 0 ? "shadow-[0_14px_35px_rgba(8,29,66,0.1)]" : "shadow-[0_6px_18px_rgba(8,29,66,0.07)]"}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="inline-flex rounded-full bg-[#0B2C6B]/7 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#0B2C6B]">{team.batch}</span>
                      <h3 className="mt-3 text-xl font-bold tracking-tight text-primary-dark">{team.name}</h3>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3E7CA] font-bold text-accent-dark">{String(index + 1).padStart(2, "0")}</div>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-y border-slate-100 py-4 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Roster master</dt>
                      <dd className="mt-1 font-bold text-slate-800">{team.members?.length || 0} anggota</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Kapten default</dt>
                      <dd className="mt-1 truncate font-bold text-slate-800">{captain?.member_name || "Belum ada"}</dd>
                    </div>
                  </dl>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-slate-500">
                      {observations === null ? "Riwayat tidak tersedia" : `${completedCount}/${missions.length} misi selesai`}
                    </p>
                    <button type="button" onClick={() => void prepareTeam(team)} className={`inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#0B2C6B] px-4 text-sm font-bold text-white shadow-md shadow-[#0B2C6B]/15 ${FOCUS}`}>
                      Siapkan Tim <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        </main>
      )}

      {step === "prepare" && (selectedTeam || isCreatingNewTeam) && (
        <WorkflowPage
          eyebrow="Langkah 1 dari 4"
          title="Siapkan tim"
          subtitle={isCreatingNewTeam ? (newTeamName || "Tim Baru") : `${selectedTeam!.name} · ${selectedTeam!.batch}`}
          backLabel="Kembali ke daftar penugasan"
          onBack={() => { setStep("tasks"); setIsCreatingNewTeam(false); }}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} dark />}
        >
           <section className="rounded-2xl bg-white p-5 shadow-[0_14px_38px_rgba(8,29,66,0.1)]" aria-labelledby="attendance-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="attendance-title" className="text-lg font-bold text-primary-dark">Kehadiran sesi</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">Atur kehadiran dan pilih satu kapten untuk snapshot sesi ini.</p>
              </div>
              <Users className="mt-1 h-5 w-5 text-accent" aria-hidden="true" />
            </div>

            {isCreatingNewTeam && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-4 space-y-3">
                <h3 className="text-sm font-bold text-primary-dark">Data Tim Baru</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1">Nama Tim</label>
                  <input
                    type="text"
                    required
                    value={newTeamName}
                    onChange={(e) => setNewTeamName(e.target.value)}
                    placeholder="Contoh: Team Alpha, Bravo 1"
                    maxLength={50}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0B2C6B] uppercase mb-1">Batch</label>
                  {batches.length > 0 ? (
                    <select
                      value={newTeamBatchId}
                      onChange={(e) => setNewTeamBatchId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 text-sm focus:outline-none focus:border-[#0B2C6B] bg-white"
                    >
                      <option value="">Pilih batch...</option>
                      {batches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-3 py-2">Belum ada batch. Hubungi admin.</p>
                  )}
                </div>
              </div>
            )}

            {memberError && <div className="mt-4"><Alert>{memberError}</Alert></div>}
            {membersLoading ? (
              <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-slate-500" role="status">
                <Loader2 className="h-5 w-5 animate-spin motion-reduce:animate-none" /> Memuat roster...
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                {teamMembers.length === 0 && <p className="rounded-2xl bg-[#F7F6F2] p-4 text-sm text-slate-500">Roster masih kosong. Tambahkan anggota di bawah.</p>}
                {teamMembers.map((member) => {
                  const isSessionCaptain = member.isPresent && sessionCaptainId === member.id;
                  return (
                     <article key={member.id} className={`rounded-xl border p-3 ${isSessionCaptain ? "border-accent bg-[#FFF9EA]" : "border-slate-200 bg-white"}`}>
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
                          <h3 className={`truncate text-sm font-bold ${member.isPresent ? "text-slate-800" : "text-slate-400"}`}>{member.member_name}</h3>
                          <p className="mt-0.5 text-xs text-slate-500">{member.isPresent ? "Hadir" : "Tidak hadir"}{member.is_captain ? " · Kapten master" : ""}</p>
                        </div>
                        <button
                          type="button"
                          disabled={!member.isPresent}
                          aria-pressed={isSessionCaptain}
                          aria-label={`Pilih ${member.member_name} sebagai kapten sesi`}
                          onClick={() => { setSessionCaptainId(member.id); setMemberError(""); }}
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-30 ${isSessionCaptain ? "border-accent bg-accent text-primary-dark" : "border-slate-200 text-slate-400"} ${FOCUS}`}
                        >
                          <Crown className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => void handleRemoveMember(member)} aria-label={`Hapus ${member.member_name} dari roster master`} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 ${FOCUS}`}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <form onSubmit={handleAddMember} className="mt-5 border-t border-slate-100 pt-5">
              <label htmlFor="new-member" className="text-sm font-bold text-[#0B2C6B]">Tambah ke roster master</label>
              <div className="mt-2 flex gap-2">
                <input id="new-member" type="text" value={newMemberName} onChange={(event) => setNewMemberName(event.target.value)} placeholder="Nama anggota" className={`min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-[#F7F6F2] px-3 text-sm text-slate-800 placeholder:text-slate-400 ${FOCUS}`} />
                <button type="submit" disabled={!newMemberName.trim() || addingMember} aria-label="Tambah anggota ke roster master" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0B2C6B] text-white disabled:opacity-40 ${FOCUS}`}>
                  {addingMember ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <UserPlus className="h-4 w-4" />}
                </button>
              </div>
            </form>
          </section>

           <div className="rounded-xl border border-accent/35 bg-[#FFF9EA] p-4" role="status">
            <p className="text-sm font-bold text-[#6D511B]">Ringkasan sesi</p>
            <p className="mt-1 text-sm text-[#7A642F]">{presentMembers.length} hadir · Kapten: {sessionCaptain?.member_name || "belum dipilih"}</p>
            <p className="mt-2 text-xs leading-relaxed text-[#8A7138]">Kapten sesi hanya tersimpan pada observasi ini dan tidak mengubah kapten master.</p>
          </div>

          <BottomAction disabled={!preparationValid || membersLoading} onClick={continueToMissions} label="Lanjut Pilih Misi" />
        </WorkflowPage>
      )}

      {step === "mission" && (selectedTeam || isCreatingNewTeam) && (
        <WorkflowPage
          eyebrow="Langkah 2 dari 4"
          title="Pilih misi"
          subtitle={`${selectedTeam?.name || newTeamName || "Tim Baru"} · ${presentMembers.length} anggota hadir`}
          backLabel="Kembali ke persiapan tim"
          onBack={() => setStep("prepare")}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} dark />}
        >
          <section aria-labelledby="missions-title">
            <div className="mb-4">
              <h2 id="missions-title" className="text-lg font-bold text-primary-dark">Semua misi</h2>
              <p className="mt-1 text-sm text-slate-500">Misi yang sudah selesai tetap dapat diobservasi kembali.</p>
            </div>
            <div className="space-y-3">
              {missions.map((mission, index) => {
                const completed = selectedTeam ? completedMissionIds(selectedTeam.id).has(mission.id) : false;
                const selected = selectedMission?.id === mission.id;
                return (
                  <button key={mission.id} type="button" aria-pressed={selected} onClick={() => setSelectedMission(mission)} className={`w-full rounded-md border p-5 text-left transition motion-reduce:transition-none ${selected ? "border-accent bg-primary-dark text-white shadow-[0_18px_40px_rgba(8,29,66,0.2)]" : "border-black/[0.04] bg-white text-primary-dark shadow-[0_7px_20px_rgba(8,29,66,0.07)]"} ${FOCUS}`}>
                    <div className="flex items-start gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-bold ${selected ? "bg-accent text-primary-dark" : "bg-[#F3E7CA] text-accent-dark"}`}>{String(index + 1).padStart(2, "0")}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold">{mission.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${completed ? "bg-emerald-100 text-emerald-700" : selected ? "bg-white/10 text-white/70" : "bg-slate-100 text-slate-500"}`}>{completed ? "Selesai" : "Tersedia"}</span>
                        </div>
                        <p className={`mt-2 line-clamp-2 text-sm leading-relaxed ${selected ? "text-white/65" : "text-slate-500"}`}>{mission.description}</p>
                        <p className={`mt-3 text-xs font-semibold ${selected ? "text-accent-light" : "text-[#0B2C6B]"}`}>{mission.dimensions.length} dimensi observasi</p>
                      </div>
                      {selected && <CheckCircle2 className="h-5 w-5 shrink-0 text-accent-light" aria-hidden="true" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          <BottomAction disabled={!selectedMission} onClick={continueToObservation} label="Mulai Observasi" />
        </WorkflowPage>
      )}

      {step === "observe" && (selectedTeam || isCreatingNewTeam) && selectedMission && (
        <WorkflowPage
          eyebrow="Langkah 3 dari 4"
          title="Catat observasi"
          subtitle={`${selectedTeam?.name || newTeamName || "Tim Baru"} · ${selectedMission.name}`}
          backLabel="Kembali ke pilihan misi"
          onBack={() => setStep("mission")}
          status={<span className="text-xs font-bold text-accent-light">{scoredCount}/{selectedMission.dimensions.length}</span>}
        >
          <section className="rounded-md bg-[#0B2C6B] p-5 text-white shadow-[0_16px_40px_rgba(8,29,66,0.2)]" aria-label="Kemajuan observasi">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-light">Kemajuan</p>
                <p className="mt-2 text-lg font-bold">{scoredCount} dari {selectedMission.dimensions.length} dimensi</p>
              </div>
              <span className="text-2xl font-bold text-accent-light">{Math.round((scoredCount / Math.max(selectedMission.dimensions.length, 1)) * 100)}%</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
              <div className="h-full rounded-full bg-accent transition-[width] duration-300 motion-reduce:transition-none" style={{ width: `${(scoredCount / Math.max(selectedMission.dimensions.length, 1)) * 100}%` }} />
            </div>
          </section>

          <div className="space-y-4">
            {selectedMission.dimensions.map((dimension, index) => {
              const selectedLevel = scores[dimension.id];
              const selectedDefinition = dimension.levels.find((level) => level.level_value === selectedLevel);
              return (
                   <fieldset key={dimension.id} className={`rounded-2xl border border-black/[0.04] bg-white p-4 shadow-[0_9px_26px_rgba(8,29,66,0.08)] sm:p-5 ${index % 2 ? "sm:ml-3" : "sm:mr-3"}`}>
                  <legend className="sr-only">{dimension.name}</legend>
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0B2C6B] text-sm font-bold text-accent-light">{index + 1}</span>
                    <div>
                      <h2 className="font-bold text-primary-dark">{dimension.name}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{dimension.question}</p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-5 gap-1 sm:gap-2" role="radiogroup" aria-label={`Skor ${dimension.name}`}>
                    {dimension.levels.map((level) => {
                      const selected = selectedLevel === level.level_value;
                      return (
                        <button
                          key={level.level_value}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`Level ${level.level_value}, ${level.level_label}`}
                          onClick={() => handleScoreSelect(dimension.id, level.level_value as LevelValue)}
                          className={`min-h-[76px] min-w-0 rounded-xl border px-0.5 py-2 text-center transition motion-reduce:transition-none sm:px-1 ${selected ? `${LEVEL_STYLES[level.level_value]} border-2 shadow-sm` : "border-slate-200 bg-[#F7F6F2] text-slate-500"} ${FOCUS}`}
                        >
                          <span className="block text-lg font-extrabold leading-none">{level.level_value}</span>
                          <span className="mt-2 block break-words text-[9px] font-bold leading-[1.15] sm:text-[10px]">{level.level_label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className={`mt-4 min-h-16 rounded-2xl p-3 text-xs leading-relaxed ${selectedDefinition ? "bg-[#F7F6F2] text-slate-600" : "border border-dashed border-slate-200 text-slate-400"}`} aria-live="polite">
                    {selectedDefinition?.description || "Pilih level yang paling sesuai dengan perilaku yang diamati."}
                  </div>
                </fieldset>
              );
            })}
          </div>

           <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(8,29,66,0.08)]" aria-labelledby="notes-title">
            <div className="flex items-center justify-between gap-3">
              <label id="notes-title" htmlFor="observation-notes" className="font-bold text-primary-dark">Catatan lapangan</label>
              <span className="text-xs font-bold tabular-nums text-slate-500" aria-live="polite">{notes.length}/50</span>
            </div>
            <textarea id="observation-notes" value={notes} maxLength={50} rows={3} onChange={(event) => handleNotesChange(event.target.value)} placeholder="Konteks singkat yang membantu pembacaan skor..." className={`mt-3 w-full resize-none rounded-2xl border border-slate-200 bg-[#F7F6F2] p-3 text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 ${FOCUS}`} />
          </section>

          <BottomAction disabled={!allDimensionsScored} onClick={() => setStep("review")} label={allDimensionsScored ? "Tinjau Observasi" : `${scoredCount}/${selectedMission.dimensions.length} Dimensi Dinilai`} />
        </WorkflowPage>
      )}

      {step === "review" && (selectedTeam || isCreatingNewTeam) && selectedMission && sessionCaptain && (
        <WorkflowPage
          eyebrow="Langkah 4 dari 4"
          title="Tinjau & konfirmasi"
          subtitle="Pastikan snapshot sesi sudah tepat sebelum disimpan."
          backLabel="Kembali mengedit skor observasi"
          onBack={() => setStep("observe")}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} dark />}
        >
          {error && <Alert>{error}</Alert>}
          <section className="overflow-hidden rounded-md bg-white shadow-[0_16px_42px_rgba(8,29,66,0.12)]" aria-labelledby="review-context-title">
            <div className="bg-[#0B2C6B] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-light">Konteks observasi</p>
              <h2 id="review-context-title" className="mt-2 text-xl font-bold">{selectedTeam?.name || newTeamName || "Tim Baru"}</h2>
              <p className="mt-1 text-sm text-white/65">{selectedTeam?.batch || batches.find((b) => b.id === newTeamBatchId)?.name || ""} · {selectedMission?.name}</p>
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
                  {presentMembers.map((member) => <li key={member.id} className="rounded-full bg-[#F7F6F2] px-3 py-1.5 text-xs font-semibold text-slate-700">{member.member_name}{member.id === sessionCaptainId ? " · Kapten" : ""}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-md bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.08)]" aria-labelledby="review-scores-title">
            <h2 id="review-scores-title" className="text-lg font-bold text-primary-dark">Skor dimensi</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              {selectedMission.dimensions.map((dimension) => {
                const value = scores[dimension.id];
                const level = dimension.levels.find((item) => item.level_value === value);
                return (
                  <div key={dimension.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <dd className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-extrabold ${LEVEL_STYLES[value]}`}>{value}</dd>
                    <div className="min-w-0">
                      <dt className="text-sm font-bold text-slate-800">{dimension.name}</dt>
                      <dd className="mt-0.5 text-xs text-slate-500">{level?.level_label}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="rounded-md border border-accent/30 bg-[#FFF9EA] p-5" aria-labelledby="review-notes-title">
            <h2 id="review-notes-title" className="text-sm font-bold text-[#6D511B]">Catatan</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#715F35]">{notes || "Tidak ada catatan."}</p>
          </section>
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-[#F7F6F2]/95 p-3 backdrop-blur">
            <div className="mx-auto grid max-w-2xl grid-cols-[0.8fr_1.2fr] gap-2">
              <button type="button" onClick={() => setStep("observe")} className={`min-h-14 rounded-2xl border border-[#0B2C6B]/20 bg-white px-3 text-sm font-bold text-[#0B2C6B] ${FOCUS}`}>Edit</button>
              <button type="button" onClick={() => void handleSubmit()} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0B2C6B] px-3 text-sm font-bold text-white shadow-lg shadow-[#0B2C6B]/20 ${FOCUS}`}>Simpan <Check className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </WorkflowPage>
      )}

      {step === "review" && isCreatingNewTeam && selectedTeam && selectedMission && sessionCaptain && (
        <WorkflowPage
          eyebrow="Langkah 4 dari 4"
          title="Tinjau & konfirmasi"
          subtitle="Pastikan snapshot sesi sudah tepat sebelum disimpan."
          backLabel="Kembali mengedit skor observasi"
          onBack={() => setStep("observe")}
          status={<NetworkBadge isOnline={isOnline} queuedCount={queuedCount} dark />}
        >
          {error && <Alert>{error}</Alert>}
          <section className="overflow-hidden rounded-md bg-white shadow-[0_16px_42px_rgba(8,29,66,0.12)]" aria-labelledby="review-context-title">
            <div className="bg-[#0B2C6B] p-5 text-white">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-light">Konteks observasi</p>
              <h2 id="review-context-title" className="mt-2 text-xl font-bold">{selectedTeam?.name || newTeamName || "Tim Baru"}</h2>
              <p className="mt-1 text-sm text-white/65">{selectedTeam?.batch || batches.find((b) => b.id === newTeamBatchId)?.name || ""} · {selectedMission?.name}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 p-5">
              <div>
                <p className="text-xs text-slate-500">Hadir</p>
                <p className="mt-1 text-lg font-bold text-primary-dark">{presentMembers.length} anggota</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Kapten sesi</p>
                <p className="mt-1 truncate text-sm font-bold text-primary-dark">{sessionCaptain?.member_name}</p>
              </div>
              <div className="col-span-2 border-t border-slate-100 pt-4">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Daftar hadir</p>
                <ul className="mt-2 flex flex-wrap gap-2" aria-label="Anggota yang hadir">
                  {presentMembers.map((member) => <li key={member.id} className="rounded-full bg-[#F7F6F2] px-3 py-1.5 text-xs font-semibold text-slate-700">{member.member_name}{member.id === sessionCaptainId ? " · Kapten" : ""}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section className="rounded-md bg-white p-5 shadow-[0_8px_24px_rgba(8,29,66,0.08)]" aria-labelledby="review-scores-title">
            <h2 id="review-scores-title" className="text-lg font-bold text-primary-dark">Skor dimensi</h2>
            <dl className="mt-4 divide-y divide-slate-100">
              {selectedMission.dimensions.map((dimension) => {
                const value = scores[dimension.id];
                const level = dimension.levels.find((item) => item.level_value === value);
                return (
                  <div key={dimension.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <dd className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg font-extrabold ${LEVEL_STYLES[value]}`}>{value}</dd>
                    <div className="min-w-0">
                      <dt className="text-sm font-bold text-slate-800">{dimension.name}</dt>
                      <dd className="mt-0.5 text-xs text-slate-500">{level?.level_label}</dd>
                    </div>
                  </div>
                );
              })}
            </dl>
          </section>

          <section className="rounded-md border border-accent/30 bg-[#FFF9EA] p-5" aria-labelledby="review-notes-title">
            <h2 id="review-notes-title" className="text-sm font-bold text-[#6D511B]">Catatan</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#715F35]">{notes || "Tidak ada catatan."}</p>
          </section>
          <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-[#F7F6F2]/95 p-3 backdrop-blur">
            <div className="mx-auto grid max-w-2xl grid-cols-[0.8fr_1.2fr] gap-2">
              <button type="button" onClick={() => setStep("observe")} className={`min-h-14 rounded-2xl border border-[#0B2C6B]/20 bg-white px-3 text-sm font-bold text-[#0B2C6B] ${FOCUS}`}>Edit</button>
              <button type="button" onClick={() => void handleSubmit()} className={`flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[#0B2C6B] px-3 text-sm font-bold text-white shadow-lg shadow-[#0B2C6B]/20 ${FOCUS}`}>Simpan <Check className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </div>
        </WorkflowPage>
      )}

      {step === "submitting" && (
        <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 text-center" role="status" aria-live="polite">
          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[#0B2C6B] shadow-xl shadow-[#0B2C6B]/20">
            <Loader2 className="h-8 w-8 animate-spin text-accent-light motion-reduce:animate-none" aria-hidden="true" />
          </div>
          <h2 className="mt-5 text-xl font-bold text-primary-dark">Menyimpan snapshot sesi</h2>
          <p className="mt-2 text-sm text-slate-500">Jangan tutup halaman sampai proses selesai.</p>
        </div>
      )}
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

function WorkflowPage({ eyebrow, title, subtitle, backLabel, onBack, status, children }: {
  eyebrow: string;
  title: string;
  subtitle: string;
  backLabel: string;
  onBack: () => void;
  status: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl bg-primary-dark p-5 text-white shadow-md">
        <div className="absolute -right-12 -top-20 h-44 w-44 rounded-full bg-[#123A72]" />
        <div className="relative mx-auto max-w-2xl">
          <div className="flex items-center justify-between gap-3">
            <button type="button" onClick={onBack} aria-label={backLabel} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/20 transition-colors ${FOCUS}`}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            {status}
          </div>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.17em] text-accent-light">{eyebrow}</p>
          <h1 className="mt-1 text-xl font-bold tracking-[-0.025em]">{title}</h1>
          <p className="mt-0.5 text-xs text-white/70">{subtitle}</p>
        </div>
      </div>
      <div className="mx-auto max-w-2xl space-y-4 pb-16">{children}</div>
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
    <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-[#F7F6F2]/95 p-3 backdrop-blur">
      <button type="button" disabled={disabled} onClick={onClick} className={`mx-auto flex min-h-14 w-full max-w-2xl items-center justify-center gap-2 rounded-2xl px-4 text-sm font-bold transition motion-reduce:transition-none ${disabled ? "bg-slate-200 text-slate-400" : "bg-[#0B2C6B] text-white shadow-lg shadow-[#0B2C6B]/20"} ${FOCUS}`}>
        {label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

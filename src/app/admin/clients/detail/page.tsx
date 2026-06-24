"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Building2, Calendar, FileText, Award, Users, BarChart3 } from "lucide-react";
import { AdminAuthGate } from "@/components/admin-auth-gate";
import { StatusPill, Breadcrumb, EmptyState, Skeleton } from "@/components/ui";
import { ErrorBoundary } from "@/components/error-boundary";
import { supabase } from "@/lib/supabase";

interface ParticipantDetail {
  id: string;
  name: string;
  email: string;
  role_title: string;
  department: string;
  organization_id: string;
  organization_name: string;
  created_at: string;
}

interface ParticipantEvidence {
  id: string;
  type: string;
  source: string;
  content: Record<string, unknown>;
  capability_tags: string[];
  confidence_score: number;
  created_at: string;
}

interface ParticipantCapability {
  id: string;
  score: number;
  capability: {
    id: string;
    name: string;
    category: string;
  };
}

interface ParticipantEngagement {
  id: string;
  role: string;
  joined_at: string;
  engagement: {
    id: string;
    title: string;
    status: string;
    type: string;
  };
}

interface ParticipantStats {
  totalEvidence: number;
  totalCapabilities: number;
  totalEngagements: number;
  avgCapabilityScore: number;
}

function ParticipantDetailContent() {
  const searchParams = useSearchParams();
  const participantId = searchParams.get("id") || "";
  const [participant, setParticipant] = useState<ParticipantDetail | null>(null);
  const [evidence, setEvidence] = useState<ParticipantEvidence[]>([]);
  const [capabilities, setCapabilities] = useState<ParticipantCapability[]>([]);
  const [engagements, setEngagements] = useState<ParticipantEngagement[]>([]);
  const [stats, setStats] = useState<ParticipantStats>({
    totalEvidence: 0,
    totalCapabilities: 0,
    totalEngagements: 0,
    avgCapabilityScore: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!participantId) {
      setError("ID peserta tidak ditemukan.");
      setLoading(false);
      return;
    }

    async function loadParticipant() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;
        if (!token) {
          setError("Sesi tidak valid.");
          setLoading(false);
          return;
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [participantRes, evidenceRes, capabilitiesRes, engagementsRes] = await Promise.all([
          fetch(`/api/participants?id=${participantId}`, { headers }),
          fetch(`/api/evidence?participant_id=${participantId}`, { headers }),
          fetch(`/api/capabilities/participant/${participantId}`, { headers }),
          fetch(`/api/engagement-participants?participant_id=${participantId}`, { headers }),
        ]);

        const participantJson = await participantRes.json();
        const evidenceJson = await evidenceRes.json();
        const capabilitiesJson = await capabilitiesRes.json();
        const engagementsJson = await engagementsRes.json();

        if (participantJson.success && participantJson.participants?.length > 0) {
          const p = participantJson.participants[0];
          setParticipant({
            id: p.id,
            name: p.name || "Tanpa Nama",
            email: p.email || "",
            role_title: p.role_title || "",
            department: p.department || "",
            organization_id: p.organization_id || "",
            organization_name: p.organization?.name || "",
            created_at: p.created_at,
          });
        }

        if (evidenceJson.success) {
          setEvidence(evidenceJson.evidence || []);
        }

        if (capabilitiesJson.success) {
          const caps = capabilitiesJson.capabilities || [];
          setCapabilities(caps);
          const totalScore = caps.reduce((sum: number, c: ParticipantCapability) => sum + (c.score || 0), 0);
          setStats((prev) => ({
            ...prev,
            totalCapabilities: caps.length,
            avgCapabilityScore: caps.length > 0 ? Math.round(totalScore / caps.length) : 0,
          }));
        }

        if (engagementsJson.success) {
          setEngagements(engagementsJson.engagements || []);
          setStats((prev) => ({
            ...prev,
            totalEngagements: engagementsJson.engagements?.length || 0,
          }));
        }

        setStats((prev) => ({ ...prev, totalEvidence: evidenceJson.evidence?.length || 0 }));
        setLoading(false);
      } catch {
        setError("Gagal memuat data peserta.");
        setLoading(false);
      }
    }

    void loadParticipant();
  }, [participantId]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (error || !participant) {
    return (
      <div className="p-6 lg:p-8">
        <EmptyState
          icon={Users}
          title="Peserta tidak ditemukan"
          description={error || "Data peserta tidak tersedia."}
          action={
            <Link href="/admin" className="text-sm font-semibold text-[#0B2C6B] hover:text-[#D9A441]">
              Kembali ke Dashboard
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <Breadcrumb
        items={[
          { label: "Admin", href: "/admin" },
          { label: "Peserta", href: "/admin" },
          { label: participant.name },
        ]}
      />

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-[#0B2C6B]">{participant.name}</h1>
        {participant.email && (
          <p className="mt-1 flex items-center gap-2 text-sm text-[#4A4C54]/60">
            <Mail size={14} />
            {participant.email}
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#0B2C6B]">Informasi Peserta</h2>
            <dl className="space-y-4">
              {participant.role_title && (
                <div>
                  <dt className="text-xs text-[#4A4C54]/50">Jabatan</dt>
                  <dd className="text-sm font-semibold text-[#0B2C6B]">{participant.role_title}</dd>
                </div>
              )}
              {participant.department && (
                <div>
                  <dt className="text-xs text-[#4A4C54]/50">Departemen</dt>
                  <dd className="text-sm font-semibold text-[#0B2C6B]">{participant.department}</dd>
                </div>
              )}
              {participant.organization_name && (
                <div>
                  <dt className="text-xs text-[#4A4C54]/50">Organisasi</dt>
                  <dd className="text-sm font-semibold text-[#0B2C6B]">{participant.organization_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs text-[#4A4C54]/50">Terdaftar</dt>
                <dd className="text-sm font-semibold text-[#0B2C6B]">
                  {new Date(participant.created_at).toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#0B2C6B]">Ringkasan</h2>
            <dl className="space-y-3">
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm text-[#4A4C54]/60">
                  <FileText size={14} /> Catatan
                </dt>
                <dd className="text-lg font-bold text-[#0B2C6B]">{stats.totalEvidence}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm text-[#4A4C54]/60">
                  <Award size={14} /> Kemampuan
                </dt>
                <dd className="text-lg font-bold text-[#0B2C6B]">{stats.totalCapabilities}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm text-[#4A4C54]/60">
                  <Users size={14} /> Program
                </dt>
                <dd className="text-lg font-bold text-[#0B2C6B]">{stats.totalEngagements}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="flex items-center gap-2 text-sm text-[#4A4C54]/60">
                  <BarChart3 size={14} /> Skor Rata-rata
                </dt>
                <dd className="text-lg font-bold text-[#0B2C6B]">{stats.avgCapabilityScore}%</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2C6B]">Kemampuan</h2>
              <span className="text-xs text-[#4A4C54]/50">{capabilities.length} kemampuan</span>
            </div>
            {capabilities.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada data kemampuan.</p>
            ) : (
              <div className="space-y-3">
                {capabilities.map((cap) => (
                  <div key={cap.id} className="flex items-center justify-between rounded-lg bg-[#F5F7FA] p-3">
                    <div>
                      <p className="text-sm font-semibold text-[#0B2C6B]">{cap.capability?.name}</p>
                      <p className="text-xs text-[#4A4C54]/50">{cap.capability?.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#0B2C6B]">{cap.score}%</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2C6B]">Program Terikuti</h2>
              <span className="text-xs text-[#4A4C54]/50">{engagements.length} program</span>
            </div>
            {engagements.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum mengikuti program.</p>
            ) : (
              <div className="space-y-3">
                {engagements.map((eng) => (
                  <Link
                    key={eng.id}
                    href={`/admin/engagements/manage?id=${eng.engagement?.id}`}
                    className="flex items-center justify-between rounded-lg bg-[#F5F7FA] p-3 transition hover:bg-[#E8ECF1]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#0B2C6B]">{eng.engagement?.title}</p>
                      <p className="text-xs text-[#4A4C54]/50">
                        Role: {eng.role} &bull; Bergabung: {new Date(eng.joined_at).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                    <StatusPill status={eng.engagement?.status || "unknown"} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-[#0B2C6B]/10 bg-white p-6 shadow-[0_18px_52px_-42px_rgba(11,44,107,0.38)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wide text-[#0B2C6B]">Catatan</h2>
              <span className="text-xs text-[#4A4C54]/50">{evidence.length} catatan</span>
            </div>
            {evidence.length === 0 ? (
              <p className="py-8 text-center text-sm text-[#4A4C54]/50">Belum ada catatan.</p>
            ) : (
              <div className="space-y-3">
                {evidence.map((ev) => (
                  <div key={ev.id} className="rounded-lg bg-[#F5F7FA] p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#0B2C6B]">{ev.type}</p>
                        <p className="text-xs text-[#4A4C54]/50">
                          Sumber: {ev.source} &bull; {new Date(ev.created_at).toLocaleDateString("id-ID")}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-[#0B2C6B]">{Math.round(ev.confidence_score * 100)}%</span>
                    </div>
                    {ev.capability_tags && ev.capability_tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {ev.capability_tags.map((tag, i) => (
                          <span key={i} className="rounded-full bg-[#0B2C6B]/10 px-2 py-0.5 text-[10px] font-semibold text-[#0B2C6B]">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminClientDetailPage() {
  return (
    <AdminAuthGate>
      <ErrorBoundary>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[#0B2C6B]">Memuat...</div>}>
          <ParticipantDetailContent />
        </Suspense>
      </ErrorBoundary>
    </AdminAuthGate>
  );
}

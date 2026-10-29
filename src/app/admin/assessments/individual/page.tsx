import { AdminShell } from '@/components/admin-shell';
import { PEAdminPilot } from '@/components/pe-admin-pilot';
import Link from 'next/link';
export default function Page(){return <AdminShell eyebrow="Self Diagnostic" title="Diagnosis individu" description="Konteks peserta, hasil, rekomendasi, dan evaluasi pilot."><Link href="/admin/assessments/individual/relationship-management" className="mb-5 inline-flex min-h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-[#0B2C6B] hover:bg-slate-50">Review Relationship Management</Link><PEAdminPilot/></AdminShell>;}

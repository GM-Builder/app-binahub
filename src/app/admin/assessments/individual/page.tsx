import { AdminShell } from '@/components/admin-shell';
import { PEAdminPilot } from '@/components/pe-admin-pilot';
export default function Page(){return <AdminShell eyebrow="Self Diagnostic" title="Diagnosis individu" description="Konteks peserta, hasil, rekomendasi, dan evaluasi pilot."><PEAdminPilot/></AdminShell>;}

import { AdminShell } from '@/components/admin-shell';
import { PECommerceAdmin } from '@/components/pe-commerce-admin';

export default function Page() {
  return <AdminShell eyebrow="Self Diagnostic" title="Transaksi individu" description="Paket dan transaksi Self Diagnostic individu."><PECommerceAdmin/></AdminShell>;
}

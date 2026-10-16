import { AdminShell } from '@/components/admin-shell';
import { PECommerceAdmin } from '@/components/pe-commerce-admin';

export default function Page() {
  return <AdminShell eyebrow="Assessment" title="Transaksi individu" description="Paket dan transaksi asesmen individu."><PECommerceAdmin/></AdminShell>;
}

'use client';
import { useCallback, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { AdminAuthGate } from '@/components/admin-auth-gate';
import { AdminShell } from '@/components/admin-shell';
import { AssessmentAudienceNav } from '@/components/assessment-audience-nav';
import { apiFetch } from '@/lib/api-fetch';
import { AssessmentPanel } from './assessment-panel';
import { TAB_META } from '../_lib/constants';

export function OrganizationAssessments() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Semua');
  const [employees, setEmployees] = useState('Semua');
  const [minScore, setMinScore] = useState('0');
  const [selected, setSelected] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const action = useCallback(async (url: string, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (init?.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await apiFetch(url, { ...init, headers });
    const body = await response.json();
    if (!response.ok || !body.success) throw new Error(body.error || 'Tindakan belum berhasil. Silakan coba lagi.');
    return body;
  }, []);
  const refresh = useCallback(async () => {}, []);
  const meta = TAB_META['Self Diagnostic'];
  return <AdminAuthGate><AdminShell {...meta} actions={<button type="button" onClick={() => setRefreshKey((value) => value + 1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0B2C6B]"><RefreshCw size={15} aria-hidden="true" />Perbarui</button>}>
    <AssessmentAudienceNav />
    <AssessmentPanel serverMode refreshToken={refreshKey} records={[]} query={query} setQuery={setQuery} category={category} setCategory={setCategory}
      employeeRange={employees} setEmployeeRange={setEmployees} minScore={minScore} setMinScore={setMinScore}
      expandedId={selected} setExpandedId={setSelected} onAction={action} onRefresh={refresh} />
  </AdminShell></AdminAuthGate>;
}

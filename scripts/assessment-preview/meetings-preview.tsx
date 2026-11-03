import { MeetingsPanel } from '@/app/admin/_components/meetings-panel';
export function MeetingsPreview() {
  return <div className="admin-ui-v2 min-h-screen bg-[#F5F7FA] text-slate-900"><div className="border-b border-slate-200 bg-white px-5 py-3 text-xs text-slate-600">Preview lokal · Data sintetis · Tidak terhubung ke Cal.com atau produksi</div>
    <main className="mx-auto max-w-[1440px] p-4 sm:p-8"><h1 className="mb-6 text-2xl font-semibold">Konsultasi</h1><MeetingsPanel serverMode /></main></div>;
}

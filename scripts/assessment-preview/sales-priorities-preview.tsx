import { SalesWorkspace } from '@/app/admin/_components/sales-workspace';
import { apiFetch } from '@/lib/api-fetch';
export function SalesPrioritiesPreview(){
  return <div className="admin-ui-v2 min-h-screen bg-[#F5F7FA] text-slate-900"><div className="border-b border-slate-200 bg-white px-5 py-3 text-xs text-slate-600">Preview lokal · Data sintetis · API harus dimock · Tidak ada pengiriman nyata</div>
    <main className="mx-auto max-w-[1440px] p-4 sm:p-8"><h1 className="mb-6 text-2xl font-semibold">Akuisisi & penjualan</h1>
      <SalesWorkspace serverMode onRefresh={async()=>{}} onAction={async(url,init)=>{
        if(init?.method&&init.method!=='GET')throw new Error('Mutations disabled in preview');
        const response=await apiFetch(url,init);const body=await response.json();if(!response.ok)throw new Error('Preview read failed');return body;
      }}/>
    </main></div>;
}

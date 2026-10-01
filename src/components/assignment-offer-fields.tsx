"use client";

export type AssignmentOfferDraft = {
  compensation: string;
  transport: string;
  preparation: string;
  deadline: string;
};

export function newAssignmentOfferDraft(): AssignmentOfferDraft {
  const expiry = new Date(Date.now() + 72 * 60 * 60_000);
  const localExpiry = new Date(expiry.getTime() - expiry.getTimezoneOffset() * 60_000);
  return { compensation: "", transport: "", preparation: "", deadline: localExpiry.toISOString().slice(0, 16) };
}

export function parseAssignmentOffer(draft: AssignmentOfferDraft) {
  const compensation = Number(draft.compensation);
  if (!draft.compensation || !Number.isSafeInteger(compensation) || compensation <= 0) throw new Error("Isi kompensasi dalam rupiah bulat lebih dari nol sebelum mengirim undangan.");
  const fee: { compensation: number; transport?: number; preparation?: number } = { compensation };
  for (const field of ["transport", "preparation"] as const) {
    if (draft[field] === "") continue;
    const amount = Number(draft[field]);
    if (!Number.isSafeInteger(amount) || amount < 0) throw new Error("Transportasi dan persiapan harus berupa rupiah bulat dan tidak boleh negatif.");
    fee[field] = amount;
  }
  const expiry = new Date(draft.deadline);
  if (!draft.deadline || !Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now() + 5 * 60_000 || expiry.getTime() > Date.now() + 30 * 24 * 60 * 60_000) {
    throw new Error("Pilih batas respons antara lima menit dan 30 hari dari sekarang.");
  }
  return { fee, invitationExpiresAt: expiry.toISOString() };
}

export function AssignmentOfferFields({ value, onChange }: { value: AssignmentOfferDraft; onChange: (value: AssignmentOfferDraft) => void }) {
  const total = Number(value.compensation || 0) + Number(value.transport || 0) + Number(value.preparation || 0);
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-semibold text-[#0B2C6B]">Rincian fee penawaran</p>
      <p className="text-xs leading-5 text-slate-600">Kompensasi wajib diisi. Transportasi dan persiapan hanya muncul di undangan jika diisi.</p>
      <div className="grid gap-3 sm:grid-cols-3">
        {([ ["compensation", "Kompensasi *"], ["transport", "Transportasi"], ["preparation", "Persiapan"] ] as const).map(([field, label]) => (
          <label key={field} className="text-xs font-medium text-slate-700">{label}
            <input type="number" min={field === "compensation" ? "1" : "0"} step="1" inputMode="numeric" value={value[field]} onChange={(event) => onChange({ ...value, [field]: event.target.value })} placeholder={field === "compensation" ? "1000000" : "Opsional"} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm" />
          </label>
        ))}
      </div>
      <p className="text-sm font-bold text-[#0B2C6B]">Total: {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number.isFinite(total) ? total : 0)}</p>
      <label className="block text-xs font-medium text-slate-700">Batas respons associate
        <input type="datetime-local" value={value.deadline} onChange={(event) => onChange({ ...value, deadline: event.target.value })} className="mt-1 min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm" />
      </label>
    </div>
  );
}

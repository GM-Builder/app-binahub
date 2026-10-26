'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, LoaderCircle, RotateCcw, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api-fetch';
import { SpinFieldControl } from '@/components/spin-discovery';
import { spinErrors, spinLabel, type SpinAnswers } from '@/lib/spin-form';
import { hasMeetingAnswer, meetingEffective, meetingFields, meetingProgress, type MeetingContext, type MeetingChecklist } from '../_lib/spin-meeting';

type Props = { id: string; onSaved: (checklist: MeetingChecklist) => void; onDirty: (dirty: boolean) => void };
const button = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2C6B] disabled:opacity-50';
const serialize = (answers: SpinAnswers, notes: string, status: MeetingChecklist['status']) => JSON.stringify({ answers, notes, status });

export function SpinMeetingChecklist(props: Props) {
  const [context, setContext] = useState<MeetingContext | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; const controller = new AbortController();
    void apiFetch(`/api/admin/discovery/${props.id}/meeting`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { const body = await response.json(); if (!response.ok) throw new Error(body.error || 'Checklist belum dapat dibuka.'); if (active) { setContext(body); setError(''); } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Checklist belum dapat dibuka.'); });
    return () => { active = false; controller.abort(); };
  }, [props.id, reload]);
  if (error) return <div role="alert" className="py-5 text-sm leading-6 text-red-700">{error} <button type="button" onClick={() => setReload(value => value + 1)} className={button + ' underline'}>Coba buka lagi</button></div>;
  if (!context) return <p role="status" className="flex items-center gap-2 py-6 text-sm text-slate-600"><LoaderCircle size={16} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />Memuat checklist meeting…</p>;
  return <MeetingEditor key={props.id + ':' + reload} {...props} context={context} onReload={() => { setContext(null); setReload(value => value + 1); }} />;
}

function MeetingEditor({ id, context, onSaved, onDirty, onReload }: Props & { context: MeetingContext; onReload: () => void }) {
  const { definition, original, checklist } = context;
  const [additions, setAdditions] = useState(checklist.answers);
  const [notes, setNotes] = useState(checklist.notes);
  const [status, setStatus] = useState(checklist.status);
  const [saved, setSaved] = useState(serialize(checklist.answers, checklist.notes, checklist.status));
  const [updatedAt, setUpdatedAt] = useState(checklist.updated_at);
  const [group, setGroup] = useState(0), [missingOnly, setMissingOnly] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [editing, setEditing] = useState<string[]>([]);
  const [error, setError] = useState(''), [conflict, setConflict] = useState(false), [saving, setSaving] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const revision = useRef(checklist.revision), lock = useRef(false), alive = useRef(true), edits = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const effective = meetingEffective(context, additions), progress = meetingProgress(definition, effective);
  const current = serialize(additions, notes, status), dirty = current !== saved;
  const errors = spinErrors(definition, effective, showErrors);
  const fields = meetingFields(definition, effective, group).filter(field => !missingOnly || missingKeys.includes(field.key) || !hasMeetingAnswer(effective[field.key]) || !!errors[field.key]);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => { onDirty(dirty || saving); return () => onDirty(false); }, [dirty, saving, onDirty]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const prevent = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener('beforeunload', prevent); return () => window.removeEventListener('beforeunload', prevent);
  }, [dirty, saving]);

  const save = useCallback(async (finish = false) => {
    if (lock.current || conflict) return;
    const targetStatus = finish ? 'completed' : status;
    if (finish) {
      const issues = spinErrors(definition, meetingEffective(context, additions), true);
      if (Object.keys(issues).length) { setShowErrors(true); setMissingOnly(true); setError('Lengkapi jawaban yang wajib sebelum menandai sesi selesai.'); return; }
    } else if (Object.keys(spinErrors(definition, meetingEffective(context, additions), false)).length) return;
    lock.current = true; setSaving(true); setError('');
    const editAtStart = edits.current;
    const payload = { revision: revision.current, answers: additions, notes, status: targetStatus };
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await apiFetch(`/api/admin/discovery/${id}/meeting`, { method: 'PATCH', signal: controller.signal, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) { if (response.status === 409 && alive.current) setConflict(true); throw new Error(body.error || 'Perubahan belum tersimpan. Coba simpan lagi.'); }
      const result = body.checklist as MeetingChecklist;
      revision.current = result.revision;
      if (alive.current) {
        // A newer local edit is never replaced by an older in-flight response.
        setSaved(serialize(additions, notes, targetStatus)); setUpdatedAt(result.updated_at);
        if (finish && edits.current === editAtStart) setStatus('completed'); onSaved(result);
      }
    } catch (reason) { if (alive.current) setError(reason instanceof Error && reason.name === 'AbortError' ? 'Koneksi terlalu lama. Jawaban masih ada di halaman ini; coba simpan lagi.' : reason instanceof Error ? reason.message : 'Perubahan belum tersimpan.'); }
    finally { clearTimeout(timer); lock.current = false; if (alive.current) setSaving(false); }
  }, [additions, conflict, context, definition, id, notes, onSaved, status]);

  useEffect(() => {
    if (!dirty || saving || error || conflict) return;
    const timer = setTimeout(() => void save(), 900); return () => clearTimeout(timer);
  }, [dirty, saving, error, conflict, save]);

  function change(key: string, value: SpinAnswers[string]) {
    onDirty(true);
    edits.current += 1;
    if (missingOnly) setMissingKeys(current => current.includes(key) ? current : [...current, key]);
    setAdditions(current => ({ ...current, [key]: value })); setStatus('in_progress');
    setError(current => conflict ? current : '');
  }
  function move(next: number) { setGroup(next); heading.current?.focus(); }
  const controls = <div className="flex flex-wrap items-center gap-2">
    <button type="button" disabled={saving || conflict || !dirty} onClick={() => void save()} className={button + ' border border-slate-300 bg-white text-[#0B2C6B]'}>{saving ? <LoaderCircle size={16} aria-hidden="true" className="animate-spin motion-reduce:animate-none" /> : <Save size={16} aria-hidden="true" />}Simpan sesi</button>
    <button type="button" disabled={saving || conflict || status === 'completed' && !dirty} onClick={() => void save(true)} className={button + ' bg-[#0B2C6B] text-white hover:bg-[#071B3D]'}><CheckCircle2 size={16} aria-hidden="true" />Tandai selesai</button>
  </div>;

  return <section aria-label="Checklist meeting" className="mt-5 min-w-0">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
      <div><h4 className="text-lg font-semibold text-slate-950">Checklist meeting</h4><p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">Jawaban klien menjadi acuan. Lengkapi bagian yang kosong atau catat klarifikasi tanpa mengubah pengisian aslinya.</p></div>{controls}
    </div>
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-medium tabular-nums text-slate-700">{progress.answered} dari {progress.total} bagian terisi <span className="ml-2 text-xs text-slate-600">{status === 'completed' ? '· Sesi selesai' : '· Sesi berjalan'}</span></p>
      <label className="flex min-h-11 cursor-pointer items-center gap-2 text-slate-700"><input type="checkbox" checked={missingOnly} onChange={event => { setMissingKeys(meetingFields(definition, effective).filter(field => !hasMeetingAnswer(effective[field.key]) || errors[field.key]).map(field => field.key)); setMissingOnly(event.target.checked); }} className="size-4 accent-[#0B2C6B]" />Hanya yang belum diisi</label>
    </div>
    <p role="status" aria-live="polite" className="min-h-6 text-xs leading-6 text-slate-600">{saving ? 'Menyimpan perubahan… Anda tetap dapat melanjutkan pengisian.' : dirty ? 'Ada perubahan yang belum tersimpan.' : updatedAt ? 'Tersimpan · ' + new Date(updatedAt).toLocaleString('id-ID') : 'Jawaban tambahan akan tersimpan otomatis saat Anda mengisi.'}</p>
    {error && <div role="alert" className="my-3 rounded-xl bg-red-50 p-4 text-sm leading-6 text-red-800">{error}{conflict ? <button type="button" onClick={() => { if (window.confirm('Muat versi terbaru? Perubahan lokal yang belum tersimpan akan diganti.')) onReload(); }} className={button + ' underline'}>Muat versi terbaru</button> : <button type="button" onClick={() => { setError(''); void save(); }} className={button + ' underline'}>Coba simpan lagi</button>}</div>}
    <div className="mt-4 grid gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
      <nav aria-label="Bagian checklist meeting" className="flex gap-1 overflow-x-auto lg:block lg:space-y-1">{definition.stages.map((label, index) => {
        const part = meetingProgress(definition, effective, index);
        return <button key={label} type="button" aria-current={group === index ? 'step' : undefined} onClick={() => move(index)} className={'flex min-h-11 shrink-0 items-center justify-between gap-3 rounded-lg px-3 py-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-[#0B2C6B] lg:w-full ' + (group === index ? 'bg-blue-50 font-semibold text-[#0B2C6B]' : 'text-slate-600 hover:bg-slate-50')}><span>{label}</span><span className="text-xs tabular-nums">{part.answered}/{part.total}</span></button>;
      })}</nav>
      <div className="min-w-0">
        <h5 ref={heading} tabIndex={-1} className="mb-5 text-base font-semibold text-slate-950 focus:outline-none">{definition.stages[group]}</h5>
        <div className="space-y-6">{fields.map(field => {
          const clientFilled = hasMeetingAnswer(original[field.key]), changed = additions[field.key] !== undefined && JSON.stringify(additions[field.key]) !== JSON.stringify(original[field.key]);
          const editable = !clientFilled || changed || editing.includes(field.key) || !!errors[field.key];
          return <div key={field.key} className="border-b border-slate-100 pb-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className={'inline-flex items-center gap-1.5 text-xs font-semibold ' + (changed ? 'text-amber-800' : clientFilled ? 'text-emerald-800' : 'text-slate-600')}>{clientFilled && !changed && <Check size={13} aria-hidden="true" />}{changed ? 'Catatan saat meeting' : clientFilled ? 'Diisi klien' : 'Belum diisi'}</span>
              {clientFilled && !editable && <button type="button" aria-label={'Klarifikasi jawaban: ' + field.label} onClick={() => setEditing(current => [...current, field.key])} className="min-h-9 px-2 text-xs font-semibold text-[#0B2C6B] underline underline-offset-4">Klarifikasi jawaban</button>}
              {changed && <button type="button" onClick={() => { edits.current += 1; setAdditions(current => { const next = { ...current }; delete next[field.key]; return next; }); setEditing(current => current.filter(key => key !== field.key)); setStatus('in_progress'); }} className="inline-flex min-h-9 items-center gap-1 px-2 text-xs font-semibold text-[#0B2C6B]"><RotateCcw size={12} aria-hidden="true" />{clientFilled ? 'Gunakan jawaban klien' : 'Kosongkan'}</button>}
            </div>
            {editable ? <SpinFieldControl definition={definition} field={field} answers={effective} error={errors[field.key]} onChange={value => change(field.key, value)} /> : <div><h6 className="text-sm font-semibold leading-6 text-slate-800">{field.label}</h6><p className="mt-2 whitespace-pre-line break-words text-sm leading-7 text-slate-700">{spinLabel(definition, original, field.key)}</p></div>}
            {changed && clientFilled && <p className="mt-3 text-xs leading-6 text-slate-600">Jawaban awal klien: {spinLabel(definition, original, field.key)}</p>}
          </div>;
        })}</div>
        {!fields.length && <p className="rounded-xl bg-slate-50 p-5 text-sm leading-7 text-slate-600">{missingOnly ? 'Tidak ada bagian kosong pada kelompok ini. Pilih kelompok lain atau tampilkan semua jawaban.' : 'Bagian ini tidak diperlukan berdasarkan jawaban saat ini.'}</p>}
        <div className="mt-5 flex justify-between gap-3"><button type="button" disabled={group === 0} onClick={() => move(group - 1)} className={button + ' text-[#0B2C6B]'}>Sebelumnya</button><button type="button" disabled={group === 4} onClick={() => move(group + 1)} className={button + ' text-[#0B2C6B]'}>Bagian berikutnya</button></div>
      </div>
    </div>
    <div className="mt-7 border-t border-slate-200 pt-5"><label htmlFor={'meeting-notes-' + id} className="text-sm font-semibold text-slate-900">Catatan dan tindak lanjut konsultasi</label><p className="mt-1 text-xs leading-6 text-slate-600">Untuk tim BinaHub saja. Tidak dikirim ke klien dan tidak mengubah laporan yang sudah tersedia.</p><textarea id={'meeting-notes-' + id} maxLength={4000} value={notes} onChange={event => { edits.current += 1; setNotes(event.target.value); setStatus('in_progress'); }} rows={4} className="mt-3 w-full rounded-xl border border-slate-300 p-3 text-sm leading-6 text-slate-900 placeholder:text-slate-600 focus-visible:outline-2 focus-visible:outline-[#0B2C6B]" placeholder="Ringkas hasil diskusi dan langkah berikutnya yang disepakati." /><div className="mt-3 flex flex-wrap items-center justify-between gap-4"><span className="text-xs tabular-nums text-slate-600">{notes.length}/4000 karakter</span>{controls}</div></div>
  </section>;
}

"use client";
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { countAnswered, firstUnanswered, peChannel, PERequestError, type PEAnswer, type PEAttempt, type PEContext, type PEDefinition } from '@/lib/individual-assessment';
import { clearPEGuestDraft, readPEGuestDraft, savePEGuestDraft, type PEGuestDraft } from '@/lib/pe-guest-storage';
import { guestRequest, makeGuestKey } from '@/lib/pe-guest';

const button = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-5 text-sm font-semibold text-white disabled:opacity-50';
const secondary = 'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-medium disabled:opacity-50';
const input = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm focus:border-blue-800';
type Reply = { attempt: PEAttempt & { revision: number }; emailStatus?: string | null };
const defaults: PEContext = { role: '', goal: '', relevance: { 'PE-02': 'normal', 'PE-04': 'normal', 'PE-06': 'normal' } };

export function PEGuestAssessment() {
  const [definition, setDefinition] = useState<PEDefinition | null>(null), [draft, setDraft] = useState<PEGuestDraft | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [context, setContext] = useState(defaults), [consent, setConsent] = useState(false);
  const [index, setIndex] = useState(0), [status, setStatus] = useState(''), [accepted, setAccepted] = useState(false);
  const [receiptId, setReceiptId] = useState(''), [localAvailable, setLocalAvailable] = useState(true);
  const [cleanupWarning,setCleanupWarning]=useState(false);
  const lock = useRef(false), current = useRef<PEGuestDraft | null>(null);
  const questions = definition ? [...definition.selfReportItems, ...definition.sjtItems] : [];
  function update(value: PEGuestDraft) { current.current = value; setDraft(value); }
  async function persist(value: PEGuestDraft) {
    update(value);
    try { await savePEGuestDraft(value); } catch { setLocalAvailable(false); }
  }
  function payload(value: PEGuestDraft, source: PEDefinition) {
    return { id: value.id, draftKey: value.draftKey, name: value.name, email: value.email, context: value.context,
      consentVersion: source.consentVersion, privacyVersion: source.privacyVersion, sharingConsentVersion: source.sharingConsentVersion,
      channel: peChannel(window.location.search) };
  }
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { definition: source } = await guestRequest<{ definition: PEDefinition }>();
        if (!alive) return;
        setDefinition(source);
        let saved: PEGuestDraft | null = null;
        try { saved = await readPEGuestDraft(); } catch { setLocalAvailable(false); }
        if (!saved || !alive) return;
        setName(saved.name); setEmail(saved.email); setContext(saved.context); setConsent(true);
        update(saved);
        try {
          const reply = await guestRequest<Reply>(`/${saved.id}`, 'GET', undefined, saved.draftKey);
          if (!alive) return;
          if (reply.attempt.status === 'submitted' && reply.emailStatus) {
            setReceiptId(saved.id); setAccepted(true); await clearPEGuestDraft().catch(() => setCleanupWarning(true)); return;
          }
          const dirty = Object.fromEntries(Object.entries(saved.responses).filter(([id, value]) => saved!.baseResponses[id] !== value));
          if(Object.entries(dirty).some(([id,value])=>reply.attempt.responses[id]!==saved!.baseResponses[id] && reply.attempt.responses[id]!==value)) {
            setError('Jawaban berubah di tab lain. Draft perangkat tetap disimpan. Gunakan jawaban server bila Anda ingin mengganti perubahan yang belum tersinkronkan.');
            setIndex(firstUnanswered([...source.selfReportItems, ...source.sjtItems],saved.responses)); return;
          }
          const restored = { ...saved, revision: reply.attempt.revision, baseResponses: reply.attempt.responses,
            responses: { ...reply.attempt.responses, ...dirty } };
          update(restored);
          setIndex(firstUnanswered([...source.selfReportItems, ...source.sjtItems], restored.responses));
          setStatus(Object.keys(dirty).length ? 'Ada jawaban di perangkat yang perlu disinkronkan.' : 'Draft berhasil dilanjutkan.');
        } catch {
          // Keep the encrypted pending choices. Do not delete them just because the network failed.
          setStatus('Draft di perangkat tersedia. Hubungkan kembali untuk menyinkronkan jawaban.');
          setIndex(firstUnanswered([...source.selfReportItems, ...source.sjtItems], saved.responses));
        }
      } catch (failure) { if (alive) setError(failure instanceof Error ? failure.message : 'Diagnosis belum dapat dimuat.'); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, []);

  async function run(action: () => Promise<void>) {
    if (lock.current) return; lock.current = true; setBusy(true); setError('');
    try { await action(); } catch (failure) { setError(failure instanceof Error ? failure.message : 'Belum tersimpan. Coba lagi.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function start() { await run(async () => {
    if (!definition || !consent) return;
    if(!name.trim() || !email.trim() || !context.role.trim() || !context.goal.trim()) throw new Error('Lengkapi nama, email, peran, dan tujuan Anda.');
    const value = current.current || { id: crypto.randomUUID(), draftKey: makeGuestKey(), name: name.trim(), email: email.trim().toLowerCase(), context,
      responses: {}, baseResponses: {}, revision: 0, expiresAt: Date.now() + 7 * 86_400_000 };
    await persist(value);
    const reply = await guestRequest<Reply>('', 'POST', payload(value, definition));
    await persist({ ...value, revision: reply.attempt.revision, responses: reply.attempt.responses, baseResponses: reply.attempt.responses });
    setStatus('Draft tersimpan.'); setIndex(0);
  }); }
  async function sync(value: PEGuestDraft, submit = false) {
    if (!definition) return;
    // Idempotent start also repairs a connection loss before the first start response arrived.
    let server: Reply;
    try { server = await guestRequest<Reply>(`/${value.id}`, 'GET', undefined, value.draftKey); }
    catch(failure) {
      if(!(failure instanceof PERequestError) || failure.status!==404) throw failure;
      server = await guestRequest<Reply>('', 'POST', payload(value, definition));
    }
    const dirty = Object.entries(value.responses).filter(([id, answer]) => value.baseResponses[id] !== answer);
    for (const [id, answer] of dirty) {
      const remote = server.attempt.responses[id];
      if (remote !== value.baseResponses[id] && remote !== answer) {
        throw new Error('Jawaban berubah di tab lain. Tinjau kembali sebelum menyinkronkan; draft perangkat Anda tetap disimpan.');
      }
    }
    const merged = { ...server.attempt.responses, ...Object.fromEntries(dirty) };
    const pending = { ...value, responses: merged, revision: server.attempt.revision,
      ...(submit ? { submissionKey: value.submissionKey || crypto.randomUUID() } : {}) };
    await persist(pending);
    const reply = await guestRequest<Reply>(`/${value.id}`, 'PATCH', { revision: pending.revision, responses: merged,
      ...(submit ? { submissionKey: pending.submissionKey } : {}) }, value.draftKey);
    if (submit) {
      setReceiptId(value.id); setAccepted(true);
      await clearPEGuestDraft().catch(() => setCleanupWarning(true));
      current.current = null; setDraft(null);
    } else { await persist({ ...pending, revision: reply.attempt.revision, baseResponses: merged }); setStatus('Jawaban tersimpan.'); }
  }
  async function answer(value: PEAnswer) { await run(async () => {
    if (!current.current || !questions[index]) return;
    const pending = { ...current.current, responses: { ...current.current.responses, [questions[index].id]: value } };
    await persist(pending); setStatus('Menyinkronkan jawaban…');
    try { await sync(pending); } catch (failure) {
      setStatus(localAvailable ? 'Jawaban disimpan di perangkat; belum tersimpan di server.' : 'Jawaban belum tersimpan. Jangan tutup halaman ini.');
      throw failure;
    }
  }); }
  const progress = draft ? countAnswered(questions, draft.responses) : 0;
  const question = questions[index], area = definition?.competencies.find(value => value.code === question?.competencyCode);

  return <main className="min-h-screen bg-[#F7F8FA] px-4 pb-12 text-[#0B2C6B] sm:px-6">
    <header className="mx-auto flex max-w-4xl items-center justify-between py-6"><Link href="/diagnose" className="inline-flex min-h-11 items-center gap-2 text-sm"><ArrowLeft size={16} />Pilihan diagnosis</Link><span className="font-semibold">BinaInsights</span></header>
    <div className="mx-auto max-w-2xl"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Diagnosis individu</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Kenali kebutuhan pengembangan Anda.</h1>
      <p className="mt-3 text-sm leading-7 text-slate-600">18 soal untuk tiga Area Personal Effectiveness. Tidak perlu membuat akun; tautan hasil dikirim ke email Anda.</p>
      <p className="mt-2 text-xs leading-6 text-slate-500">Tidak dibatasi waktu. Anda dapat berhenti sejenak dan melanjutkan draft pada perangkat ini selama tujuh hari.</p>
      {error && <div role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">{error}
        <button type="button" disabled={busy} className={`${secondary} mt-3`} onClick={() => current.current ? void run(() => sync(current.current!, Boolean(current.current!.submissionKey))) : window.location.reload()}><RefreshCw size={15} />Coba lagi</button>
        {error.includes('tab lain')&&<button type="button" disabled={busy} className={`${secondary} ml-2 mt-3`} onClick={()=>void run(async()=>{
          const value=current.current!; const remote=await guestRequest<Reply>(`/${value.id}`,'GET',undefined,value.draftKey);
          await persist({...value,revision:remote.attempt.revision,responses:remote.attempt.responses,baseResponses:remote.attempt.responses});
          setIndex(firstUnanswered(questions,remote.attempt.responses));setStatus('Jawaban server dimuat.');
        })}>Gunakan jawaban server</button>}</div>}
      {!localAvailable && !accepted && <p role="status" className="mt-4 text-xs leading-6 text-amber-800">Browser ini belum dapat menyimpan draft pada perangkat. Jangan tutup halaman sebelum selesai mengirim, karena draft mungkin tidak dapat dilanjutkan setelah halaman ditutup.</p>}
      {cleanupWarning && <p role="status" className="mt-4 text-xs leading-6 text-amber-800">Jawaban sudah diterima, tetapi browser belum dapat menghapus draft perangkat. Untuk privasi di perangkat bersama, bersihkan data situs ini setelah selesai.</p>}
      {loading ? <p role="status" className="mt-8 flex items-center gap-3"><Loader2 className="motion-safe:animate-spin" />Menyiapkan diagnosis…</p> : accepted ?
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6"><CheckCircle2 className="text-emerald-600" /><h2 className="mt-4 text-xl font-semibold">Jawaban Anda sudah diterima.</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">Tautan hasil akan dikirim ke email yang Anda isi. Anda dapat menutup halaman ini; pengiriman tetap diproses.</p>
          <p className="mt-2 text-xs leading-6 text-slate-500">Periksa juga folder spam atau promosi. Jangan meneruskan tautan hasil karena berisi akses pribadi.</p>
          <Link href={`/insight/individual/result?attempt=${receiptId}`} className={`${secondary} mt-5`}>Bantuan akses hasil</Link></section>
      : definition?.acceptingNew === false && !draft ? <p role="status" className="mt-8 rounded-2xl bg-white p-6">Pengisian baru sedang dijeda. Draft sebelumnya tetap dapat dilanjutkan.</p>
      : definition && !draft ? <form className="mt-7 space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7" onSubmit={event => { event.preventDefault(); void start(); }}>
        <div className="flex flex-wrap gap-2">{definition.competencies.map(value => <span key={value.code} className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium">{value.name}</span>)}</div>
        <label className="block text-sm font-medium">Nama Anda<input required maxLength={100} autoComplete="name" className={input} value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
        <label className="block text-sm font-medium">Email untuk menerima hasil<input required type="email" maxLength={254} autoComplete="email" className={input} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /></label>
        <label className="block text-sm font-medium">Peran atau pekerjaan Anda<input required maxLength={100} className={input} value={context.role} disabled={busy} onChange={event => setContext({ ...context, role: event.target.value })} /></label>
        <label className="block text-sm font-medium">Apa yang ingin Anda kembangkan?<textarea required maxLength={600} rows={3} className={input} value={context.goal} disabled={busy} onChange={event => setContext({ ...context, goal: event.target.value })} /></label>
        <fieldset><legend className="text-sm font-medium">Relevansi dengan pekerjaan Anda</legend><div className="mt-3 space-y-3">{definition.competencies.map(value => <label key={value.code} className="flex flex-wrap items-center justify-between gap-3 text-sm">{value.name}<select className="min-h-11 rounded-lg border border-slate-200 px-3" aria-label={`Relevansi ${value.name}`} value={context.relevance[value.code]} disabled={busy} onChange={event => setContext({ ...context, relevance: { ...context.relevance, [value.code]: event.target.value as 'low' | 'normal' | 'high' } })}><option value="low">Kurang relevan</option><option value="normal">Relevan</option><option value="high">Sangat relevan</option></select></label>)}</div></fieldset>
        <div className="text-xs leading-6 text-slate-600"><p>{definition.notice}</p><p className="mt-2">{definition.privacyNotice}</p><p className="mt-2">{definition.sharingNotice}</p><p className="mt-2">Dengan persetujuan Anda, draft sementara disimpan terenkripsi pada perangkat ini untuk pemulihan koneksi, lalu dihapus setelah pengiriman berhasil atau setelah tujuh hari saat dibuka kembali.</p></div>
        <label className="flex items-start gap-3 text-sm leading-6"><input type="checkbox" required checked={consent} disabled={busy} onChange={event => setConsent(event.target.checked)} className="mt-1 h-5 w-5 shrink-0" />Saya memahami penggunaan data dan mengizinkan tim BinaHub meninjau jawaban serta hasil untuk rekomendasi pengembangan.</label>
        <button className={`${button} w-full`} disabled={busy || !consent}>{busy && <Loader2 className="motion-safe:animate-spin" size={17} />}Mulai diagnosis<ArrowRight size={17} /></button>
      </form> : definition && draft ? <section className="mt-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-7">
        <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500"><span>{progress} dari {questions.length} soal</span><span role="status" aria-live="polite">{busy ? 'Menyimpan…' : status}</span></div>
        <progress value={progress} max={questions.length} aria-label="Kemajuan pengisian" className="mt-3 h-2 w-full accent-blue-900" />
        {question ? <><p className="mt-6 text-xs text-slate-500">Area {area?.name} · {question.type === 'behavioral_self_report' ? 'Pengalaman kerja dalam tiga bulan terakhir' : 'Studi kasus'}</p>
          {question.scenario && <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-700">{question.scenario}</p>}
          <fieldset className="mt-5"><legend className="text-lg font-medium leading-7">{question.prompt || question.question}</legend><div className="mt-4 space-y-3">{(question.type === 'behavioral_self_report' ? definition.selfReportScale.map(value => ({ value: value.value, label: value.label })) : question.options!.map(value => ({ value: value.id as PEAnswer, label: value.text }))).map(value => <label key={value.value} className={`flex min-h-14 items-center gap-3 rounded-xl border p-4 text-sm leading-6 ${draft.responses[question.id] === value.value ? 'border-blue-900 bg-blue-50' : 'border-slate-200'}`}><input type="radio" name={question.id} checked={draft.responses[question.id] === value.value} disabled={busy} onChange={() => void answer(value.value)} className="h-5 w-5 shrink-0" /><span>{value.label}</span></label>)}</div></fieldset>
          <div className="mt-6 flex justify-between gap-3"><button className={secondary} disabled={busy || index === 0} onClick={() => setIndex(value => value - 1)}><ArrowLeft size={16} />Kembali</button><button className={button} disabled={busy || !Object.hasOwn(draft.responses, question.id)} onClick={() => { setIndex(value => value + 1); window.scrollTo({ top: 0, behavior: 'instant' }); }}>{index === questions.length - 1 ? 'Tinjau jawaban' : 'Lanjut'}<ArrowRight size={16} /></button></div>
        </> : <><h2 className="mt-6 text-xl font-semibold">Periksa sebelum mengirim.</h2><p className="mt-3 text-sm leading-7 text-slate-600">Jawaban dikunci setelah diterima. Hasil dan langkah pengembangan dikirim melalui tautan email pribadi.</p>
          <div className="mt-5 space-y-2">{definition.competencies.map(value => <button className="flex min-h-14 w-full items-center justify-between rounded-xl border border-slate-200 p-4 text-left text-sm" key={value.code} disabled={busy} onClick={() => setIndex(questions.findIndex(question => question.competencyCode === value.code))}><span>{value.name}</span><span>Tinjau</span></button>)}</div>
          <p className="mt-4 text-xs leading-6 text-slate-500">NA tidak dihitung sebagai nol. Bila kesempatan relevan terlalu sedikit, hasil menampilkan keterbatasan bukti.</p>
          <button className={`${button} mt-5 w-full`} disabled={busy || progress !== questions.length} onClick={() => void run(() => sync(current.current!, true))}>{busy ? <Loader2 size={17} className="motion-safe:animate-spin" /> : <CheckCircle2 size={17} />}Kirim jawaban</button></>}
      </section> : null}
      <p className="mt-5 text-xs leading-6 text-slate-500">Bantuan pengisian dan privasi: <a href="mailto:admin@binahub.id" className="underline">admin@binahub.id</a>. Hasil bukan diagnosis klinis.</p>
    </div>
  </main>;
}

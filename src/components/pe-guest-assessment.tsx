"use client";
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Brain, ChartNoAxesCombined, CheckCircle2, Info, Loader2, Mail, RefreshCw, ShieldCheck, UserRound, Waypoints } from 'lucide-react';
import { countAnswered, firstUnanswered, individualTrackingParams, peChannel, type PEAnswer, type PEAttempt, type PEContext, type PEDefinition } from '@/lib/individual-assessment';
import { clearPEGuestDraft, readPEGuestDraft, savePEGuestDraft, type PEGuestDraft } from '@/lib/pe-guest-storage';
import { guestRequest, makeGuestKey } from '@/lib/pe-guest';
import { PEGuestSyncQueue, hasPendingPEAnswers } from '@/lib/pe-guest-sync';
import { DiagnosisShell } from './diagnosis-shell';
import shared from './diagnosis.module.css';
import styles from './pe-diagnosis.module.css';

const button = shared.primaryButton;
const secondary = shared.secondaryButton;
type Reply = { attempt: PEAttempt & { revision: number }; emailStatus?: string | null };
const defaults: PEContext = { role: '', goal: '', relevance: { 'PE-02': 'normal', 'PE-04': 'normal', 'PE-06': 'normal' } };

export function PEGuestAssessment() {
  const [definition, setDefinition] = useState<PEDefinition | null>(null), [draft, setDraft] = useState<PEGuestDraft | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [context, setContext] = useState(defaults), [consent, setConsent] = useState(false);
  const [index, setIndex] = useState(0), [status, setStatus] = useState(''), [accepted, setAccepted] = useState(false);
  const [receiptId, setReceiptId] = useState(''), [localAvailable, setLocalAvailable] = useState(true);
  const [cleanupWarning,setCleanupWarning]=useState(false);
  const [syncError, setSyncError] = useState('');
  const lock = useRef(false), current = useRef<PEGuestDraft | null>(null);
  const localWrites = useRef<Promise<void>>(Promise.resolve());
  const pendingLocal = useRef(0), storageReady = useRef(true);
  const syncQueue = useRef<PEGuestSyncQueue | null>(null);
  const taskHeading = useRef<HTMLElement | null>(null);
  const receiptHeading = useRef<HTMLHeadingElement | null>(null);
  const questions = definition ? [...definition.selfReportItems, ...definition.sjtItems] : [];
  const update = useCallback((value: PEGuestDraft) => { current.current = value; setDraft(value); }, []);
  const persist = useCallback(async (value: PEGuestDraft) => {
    update(value);
    pendingLocal.current++;
    const write = localWrites.current.then(() => savePEGuestDraft(value));
    localWrites.current = write.catch(() => { storageReady.current = false; setLocalAvailable(false); });
    try { await localWrites.current; } finally { pendingLocal.current--; }
  }, [update]);
  function payload(value: PEGuestDraft, source: PEDefinition) {
    const params=individualTrackingParams(window.location.search);
    const attribution=Object.fromEntries([['utm_source','utmSource'],['utm_medium','utmMedium'],['utm_campaign','utmCampaign'],['utm_content','utmContent'],['utm_term','utmTerm'],['gclid','gclid'],['fbclid','fbclid'],['msclkid','msclkid']]
      .map(([key,target])=>[target,params.get(key)?.trim().slice(0,500)]).filter(([,entry])=>Boolean(entry)));
    const journey=params.get('bh_journey');
    return { id: value.id, draftKey: value.draftKey, name: value.name, email: value.email, context: value.context,
      consentVersion: source.consentVersion, privacyVersion: source.privacyVersion, sharingConsentVersion: source.sharingConsentVersion,
      attribution,...(journey&&/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(journey)?{journeyId:journey}:{}),
      channel: peChannel(window.location.search) };
  }
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const { definition: source } = await guestRequest<{ definition: PEDefinition }>();
        if (!alive) return;
        setDefinition(source);
        const queue = new PEGuestSyncQueue({ current: () => current.current, persist, request: guestRequest,
          startPayload: value => payload(value, source), status: message => {
            if (!alive) return;
            setStatus(message);
            if (message === 'Semua jawaban tersimpan.') setSyncError('');
          },
          failure: failure => {
            if (!alive) return;
            setSyncError(failure instanceof Error && failure.message.includes('tab lain') ? failure.message
              : 'Jawaban belum tersimpan di server. Anda tetap dapat melanjutkan; kami akan mencoba lagi saat koneksi kembali.');
            setStatus(storageReady.current ? 'Jawaban disimpan di perangkat.' : 'Jawaban belum tersimpan. Jangan tutup halaman.');
          },
        });
        syncQueue.current = queue;
        let saved: PEGuestDraft | null = null;
        try { saved = await readPEGuestDraft(); } catch { storageReady.current = false; setLocalAvailable(false); }
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
          if (Object.keys(dirty).length) queue.schedule();
        } catch {
          // Keep the encrypted pending choices. Do not delete them just because the network failed.
          setStatus('Draft di perangkat tersedia. Hubungkan kembali untuk menyinkronkan jawaban.');
          setIndex(firstUnanswered([...source.selfReportItems, ...source.sjtItems], saved.responses));
        }
      } catch (failure) { if (alive) setError(failure instanceof Error ? failure.message : 'Diagnosis belum dapat dimuat.'); }
      finally { if (alive) setLoading(false); }
    })();
    const online = () => { setSyncError(''); syncQueue.current?.schedule(); };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (pendingLocal.current || (!storageReady.current && current.current && hasPendingPEAnswers(current.current))) {
        event.preventDefault(); event.returnValue = '';
      }
    };
    window.addEventListener('online', online); window.addEventListener('beforeunload', beforeUnload);
    return () => { alive = false; syncQueue.current?.dispose();
      window.removeEventListener('online', online); window.removeEventListener('beforeunload', beforeUnload); };
  }, [persist, update]);

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
    if (!definition || !syncQueue.current) return;
    setSyncError(''); await localWrites.current;
    await syncQueue.current.flush(submit);
    if (submit) {
      setReceiptId(value.id); setAccepted(true);
      syncQueue.current.dispose();
      await localWrites.current;
      await clearPEGuestDraft().catch(() => setCleanupWarning(true));
      current.current = null; setDraft(null);
    }
  }
  function answer(value: PEAnswer) {
    if (lock.current || !current.current || current.current.submissionKey || !questions[index]) return;
    const pending = { ...current.current, responses: { ...current.current.responses, [questions[index].id]: value } };
    setStatus('Menyimpan di perangkat…'); setSyncError('');
    void persist(pending).then(() => syncQueue.current?.schedule());
  }
  const progress = draft ? countAnswered(questions, draft.responses) : 0;
  const question = questions[index], area = definition?.competencies.find(value => value.code === question?.competencyCode);
  const draftId = draft?.id;
  useEffect(() => {
    if (accepted) {
      receiptHeading.current?.focus({ preventScroll: true });
      window.scrollTo({ top: 0, behavior: 'instant' });
    } else if (!loading && draftId) taskHeading.current?.focus({ preventScroll: true });
  }, [index, loading, draftId, accepted]);

  const guide = definition && <aside className={`${styles.guide} ${draft ? styles.taskGuide : ''}`} aria-label="Tentang diagnosis ini">
    <span className={`${shared.iconTile} ${shared.iconGold}`}><UserRound size={25} aria-hidden="true" /></span>
    <h2>Tentang diagnosis ini</h2>
    <p>Kenali pengalaman kerja dan respons Anda pada tiga area pengembangan diri.</p>
    <ul className={styles.areaList}>{definition.competencies.map((value, i) => {
      const Icon = [Brain, Waypoints, ChartNoAxesCombined][i % 3];
      const items = questions.filter(item => item.competencyCode === value.code);
      return <li key={value.code} className={draft && area?.code === value.code ? styles.areaActive : undefined}>
        <span className={styles.areaIcon}><Icon size={20} aria-hidden="true" /></span>
        <div><strong>{value.name}</strong><p>{draft ? `${countAnswered(items, draft.responses)} dari ${items.length} terisi` : value.definition}</p></div>
      </li>;
    })}</ul>
    <div className={styles.guideNote}><ShieldCheck size={20} aria-hidden="true" /><div><strong>Hasil pribadi Anda</strong><p>Tautan hasil dikirim ke email Anda. Penggunaan data dan izin tinjauan dijelaskan sebelum Anda mulai.</p></div></div>
  </aside>;

  return <DiagnosisShell organization><div className={styles.layout} aria-label="Diagnosis individu">
      {!accepted && <div className={`${styles.intro} ${draft ? styles.taskIntro : ''}`}>
        <h1>{draft ? 'Diagnosis individu' : 'Pahami kebutuhan pengembangan diri Anda.'}</h1>
        <p>{draft ? 'Isi sesuai pengalaman Anda. Jawaban disimpan di latar belakang, tanpa perlu menunggu untuk melanjutkan.' : `Kenali cara Anda mengembangkan diri, beradaptasi, dan menghadapi tekanan melalui ${definition ? questions.length : '18'} pertanyaan. Tautan untuk melihat hasil asesmen akan dikirim ke email Anda.`}</p>
      </div>}
      {error && <div role="alert" className={styles.alert}>{error}
        <button type="button" disabled={busy} className={`${secondary} mt-3`} onClick={() => current.current ? void run(() => sync(current.current!, Boolean(current.current!.submissionKey))) : window.location.reload()}><RefreshCw size={15} />Coba lagi</button>
        {error.includes('tab lain')&&<button type="button" disabled={busy} className={`${secondary} ml-2 mt-3`} onClick={()=>void run(async()=>{
          const value=current.current!; const remote=await guestRequest<Reply>(`/${value.id}`,'GET',undefined,value.draftKey);
          await persist({...value,revision:remote.attempt.revision,responses:remote.attempt.responses,baseResponses:remote.attempt.responses});
          setIndex(firstUnanswered(questions,remote.attempt.responses));setStatus('Jawaban server dimuat.');
        })}>Gunakan jawaban server</button>}</div>}
      {!localAvailable && !accepted && <p role="status" className={styles.alert}>Browser ini belum dapat menyimpan draft pada perangkat. Jangan tutup halaman sebelum selesai mengirim, karena draft mungkin tidak dapat dilanjutkan setelah halaman ditutup.</p>}
      {cleanupWarning && <p role="status" className={styles.alert}>Jawaban sudah diterima, tetapi browser belum dapat menghapus draft perangkat. Untuk privasi di perangkat bersama, bersihkan data situs ini setelah selesai.</p>}
      {syncError && !accepted && <div role="status" className={styles.alert}>{syncError}<button type="button" disabled={busy} className="ml-2 min-h-11 font-semibold underline underline-offset-4" onClick={() => current.current && void run(() => sync(current.current!))}>Coba simpan lagi</button>{syncError.includes('tab lain') && <button type="button" disabled={busy} className="ml-2 min-h-11 font-semibold underline underline-offset-4" onClick={() => void run(async () => {
        const value = current.current!; const remote = await guestRequest<Reply>(`/${value.id}`, 'GET', undefined, value.draftKey);
        await persist({ ...value, revision: remote.attempt.revision, responses: remote.attempt.responses, baseResponses: remote.attempt.responses });
        setSyncError(''); setStatus('Jawaban server dimuat.'); setIndex(firstUnanswered(questions, remote.attempt.responses));
      })}>Gunakan jawaban server</button>}</div>}
      {loading ? <section className={`${styles.card} ${shared.loadingPanel}`} aria-busy="true"><p role="status">Menyiapkan diagnosis…</p><span className={`${shared.skeletonLine} ${shared.skeletonHeading}`} aria-hidden="true" /><span className={shared.skeletonLine} aria-hidden="true" /><span className={shared.skeletonLine} aria-hidden="true" /></section> : accepted ?
        <section className={styles.receipt}><span className={`${shared.iconTile} ${shared.successIcon}`}><CheckCircle2 size={28} aria-hidden="true" /></span><h1 ref={receiptHeading} tabIndex={-1}>Jawaban Anda sudah diterima.</h1>
          <p>Tautan hasil akan dikirim ke <span className={styles.email}>{email}</span>. Anda dapat menutup halaman ini; pengiriman tetap diproses.</p>
          <ul className={styles.receiptSteps}><li><Mail size={19} aria-hidden="true" />Periksa email, termasuk folder spam atau promosi.</li><li><ChartNoAxesCombined size={19} aria-hidden="true" />Buka laporan untuk melihat profil area dan langkah pengembangan.</li><li><ShieldCheck size={19} aria-hidden="true" />Jangan meneruskan tautan hasil karena berisi akses pribadi.</li></ul>
          <div className={styles.receiptActions}><Link href={`/insight/individual/result?attempt=${receiptId}`} className={button}>Bantuan akses hasil<ArrowRight size={16} aria-hidden="true" /></Link><Link href="/diagnose" className={secondary}>Pilihan diagnosis</Link></div></section>
      : definition?.acceptingNew === false && !draft ? <p role="status" className={styles.card}>Pengisian baru sedang dijeda. Draft sebelumnya tetap dapat dilanjutkan.</p>
      : definition && <div className={styles.workspace}>{guide}{!draft ? <form className={styles.card} aria-busy={busy} onSubmit={event => { event.preventDefault(); void start(); }}>
        <h2>Sebelum Anda mulai</h2><p className={styles.lead}>Ceritakan sedikit tentang pekerjaan dan tujuan Anda agar rekomendasi lebih sesuai dengan kebutuhan Anda.</p>
        <ul aria-label="Area yang dinilai" className={styles.areaChips}>{definition.competencies.map(value => <li key={value.code}>{value.name}</li>)}</ul>
        <div className={styles.fields}>
          <label className={styles.field}>Nama Anda<input required maxLength={100} autoComplete="name" placeholder="Masukkan nama Anda" value={name} disabled={busy} onChange={event => setName(event.target.value)} /></label>
          <div className={styles.field}><label htmlFor="pe-guest-email">Alamat email</label><input id="pe-guest-email" required type="email" maxLength={254} autoComplete="email" placeholder="nama@perusahaan.com" aria-describedby="pe-email-help" value={email} disabled={busy} onChange={event => setEmail(event.target.value)} /><p id="pe-email-help" className={styles.help}>Pastikan alamat email benar agar tautan hasil sampai kepada Anda.</p></div>
          <label className={styles.field}>Peran atau pekerjaan Anda<input required maxLength={100} autoComplete="organization-title" placeholder="Contoh: Staf pemasaran, HR, pemilik usaha" value={context.role} disabled={busy} onChange={event => setContext({ ...context, role: event.target.value })} /></label>
          <label className={styles.field}>Apa yang ingin Anda kembangkan?<textarea required maxLength={600} rows={3} placeholder="Ceritakan tujuan pengembangan Anda secara singkat" value={context.goal} disabled={busy} onChange={event => setContext({ ...context, goal: event.target.value })} /></label>
          <fieldset aria-describedby="pe-relevance-help"><legend className={styles.legend}>Kaitannya dengan pekerjaan Anda</legend><p id="pe-relevance-help" className={styles.help}>Seberapa relevan setiap area berikut dengan pekerjaan Anda saat ini?</p><div className={styles.relevance}>{definition.competencies.map(value => <label key={value.code}>{value.name}<select aria-label={`Relevansi ${value.name}`} value={context.relevance[value.code]} disabled={busy} onChange={event => setContext({ ...context, relevance: { ...context.relevance, [value.code]: event.target.value as 'low' | 'normal' | 'high' } })}><option value="low">Kurang relevan</option><option value="normal">Relevan</option><option value="high">Sangat relevan</option></select></label>)}</div></fieldset>
        </div>
        <div className={styles.notice}><Info size={16} aria-hidden="true" /><p>Isi sesuai pengalaman Anda, tanpa batas waktu pengerjaan. Hasilnya bukan diagnosis klinis dan tidak dapat menjadi satu-satunya dasar keputusan seleksi atau promosi.</p></div>
        <details className={styles.privacy}><summary>Privasi dan penggunaan data</summary><div id="pe-data-use"><p>{definition.privacyNotice}</p><p>{definition.sharingNotice}</p><p>Dengan persetujuan Anda, jawaban sementara disimpan secara terenkripsi di perangkat ini agar Anda dapat melanjutkan pengisian saat koneksi terputus. Simpanan ini dihapus setelah jawaban berhasil dikirim, atau saat halaman dibuka kembali setelah tujuh hari.</p></div></details>
        <label className={styles.consent}><input type="checkbox" required checked={consent} disabled={busy} aria-describedby="pe-data-use" onChange={event => setConsent(event.target.checked)} />Saya menyetujui penggunaan data yang dijelaskan di atas dan mengizinkan tim BinaHub meninjau jawaban serta hasil asesmen untuk memberikan rekomendasi pengembangan.</label>
        <button className={`${button} ${styles.start}`} disabled={busy || !consent} aria-describedby={!consent ? 'pe-start-help' : undefined}>{busy && <Loader2 className="motion-safe:animate-spin" size={17} aria-hidden="true" />}{busy ? 'Menyiapkan pengisian…' : 'Mulai diagnosis'}<ArrowRight size={17} aria-hidden="true" /></button>
        {!consent && <p id="pe-start-help" className={styles.hint}>Baca penggunaan data dan centang persetujuan untuk melanjutkan.</p>}
      </form> : <section className={styles.card}>
        <div className={styles.questionMeta}><span>{question ? `Soal ${index + 1} dari ${questions.length}` : 'Tinjauan jawaban'}</span><span>{progress} dari {questions.length} terisi</span></div>
        <progress value={progress} max={questions.length || 1} aria-label="Kemajuan pengisian" className={styles.progress} />
        {question ? <><p className={styles.questionKind}><strong>{area?.name}</strong><span>{question.type === 'behavioral_self_report' ? 'Pengalaman kerja dalam tiga bulan terakhir' : 'Studi kasus'}</span></p>
          {question.scenario && <p className={styles.scenario}>{question.scenario}</p>}
          <fieldset className={styles.question}><legend ref={node => { taskHeading.current = node; }} tabIndex={-1}>{question.prompt || question.question}</legend><div className={styles.answers}>{(question.type === 'behavioral_self_report' ? definition.selfReportScale.map(value => ({ value: value.value, label: value.label })) : question.options!.map(value => ({ value: value.id as PEAnswer, label: value.text }))).map(value => <label key={value.value} className={`${styles.answer} ${draft.responses[question.id] === value.value ? styles.answerSelected : ''}`}><input type="radio" name={question.id} checked={draft.responses[question.id] === value.value} disabled={busy || Boolean(draft.submissionKey)} onChange={() => void answer(value.value)} /><span>{value.label}</span></label>)}</div></fieldset>
          <div className={styles.footer}><button className={secondary} disabled={busy || index === 0} onClick={() => setIndex(value => value - 1)}><ArrowLeft size={16} aria-hidden="true" />Kembali</button><button className={button} disabled={busy || !Object.hasOwn(draft.responses, question.id)} aria-describedby={!Object.hasOwn(draft.responses, question.id) ? 'pe-next-help' : undefined} onClick={() => { setIndex(value => value + 1); window.scrollTo({ top: 0, behavior: 'instant' }); }}>{index === questions.length - 1 ? 'Tinjau jawaban' : 'Lanjut'}<ArrowRight size={16} aria-hidden="true" /></button></div>
          {!Object.hasOwn(draft.responses, question.id) && <p id="pe-next-help" className={styles.hint}>Pilih satu jawaban untuk melanjutkan.</p>}
        </> : <><h2 ref={node => { taskHeading.current = node; }} tabIndex={-1} className="mt-6">Periksa sebelum mengirim.</h2><p className={styles.lead}>Jawaban dikunci setelah diterima. Hasil dan langkah pengembangan dikirim melalui tautan email pribadi.</p>
          <div className={styles.review}>{definition.competencies.map(value => { const items = questions.filter(item => item.competencyCode === value.code); return <button key={value.code} disabled={busy} onClick={() => setIndex(questions.findIndex(question => question.competencyCode === value.code))}><span>{value.name}<small>{countAnswered(items, draft.responses)} dari {items.length} jawaban terisi</small></span><span>Tinjau<ArrowRight size={15} aria-hidden="true" /></span></button>; })}</div>
          <p className={`${styles.help} mt-4`}>NA tidak dihitung sebagai nol. Bila kesempatan relevan terlalu sedikit, hasil menampilkan keterbatasan bukti.</p>
          <button className={`${button} ${styles.start}`} disabled={busy || progress !== questions.length} aria-busy={busy} onClick={() => void run(() => sync(current.current!, true))}>{busy ? <Loader2 size={17} className="motion-safe:animate-spin" aria-hidden="true" /> : <CheckCircle2 size={17} aria-hidden="true" />}{busy ? 'Mengirim jawaban…' : 'Kirim jawaban'}</button></>}
        <p className={styles.save} role="status" aria-live="polite">{busy ? 'Menyimpan…' : status}</p>
      </section>}</div>}
      <p className={styles.support}>Butuh bantuan? Hubungi <a href="mailto:admin@binahub.id">admin@binahub.id</a>.</p>
    </div></DiagnosisShell>;
}

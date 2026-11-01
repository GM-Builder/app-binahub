"use client";

import {useCallback, useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {ArrowLeft, ArrowRight, ChevronDown, Copy, RefreshCw, Search} from 'lucide-react';
import {supabase} from '@/lib/supabase';
import {petaDate, petaRequest, type PetaReportData} from '@/lib/peta';
import {PetaReport} from './peta-report';
import {PetaPDFDownload} from './peta-pdf-download';
import {PetaGroupReport} from './peta-group-report';
import {ProgramShareCard} from './program-share-card';
import styles from './peta-admin.module.css';

type Workspace = {id:string; name:string; consultantAccess:boolean; privacyReference:string; programId?:string|null; programStatus?:string|null};
type Program = {id:string; title:string; code:string; status:string; petaEnabled:boolean};
type Invitation = {id:string; workspaceId:string; participantCode:string; purpose:string; expiresAt:string; status:string};
type Session = {id:string; workspaceId:string; participantCode:string; participantName?:string|null; programId?:string|null; status:string; completedBlocks:number; retentionUntil:string; submittedAt:string|null; canReadResult:boolean; instrumentVersion:string; consentVersion:string; consentedAt:string; reviewConsent:boolean};
type AccessEvent = {id:string; workspaceId:string; participantCode:string|null; event:string; createdAt:string; adminAction:boolean};
type Dashboard = {sourceReady:boolean; programs?:Program[]; workspaces:Workspace[]; invitations:Invitation[]; sessions:Session[]; audit:AccessEvent[]; counts?:{total:number;inProgress:number;submitted:number};total?:number;page?:number;pageSize?:number};
type View = 'participants'|'access'|'settings'|'reports';
const statusText:Record<string,string> = {invited:'Belum dimulai', used:'Sudah digunakan', expired:'Kedaluwarsa', revoked:'Akses dicabut', in_progress:'Sedang diisi', submitted:'Selesai'};
const eventText:Record<string,string> = {workspace_created:'Pengaturan dibuat', invitation_created:'Undangan dibuat', consented:'Persetujuan peserta dicatat', access_recovered:'Akses peserta dipulihkan', submitted:'Jawaban akhir dikirim', participant_result_opened:'Peserta membuka hasil', consultant_result_opened:'Admin pendamping membuka hasil peserta', participant_pdf_requested:'Peserta meminta PDF individu', admin_individual_pdf_requested:'Admin meminta PDF individu', admin_group_report_opened:'Admin membuka laporan grup', admin_group_pdf_requested:'Admin meminta PDF grup', recovery_issued_after_verification:'Tautan pemulihan dibuat setelah verifikasi', invitation_revoked:'Undangan dicabut', revoke:'Akses sesi dicabut', erase:'Data sesi dihapus', retention_erased:'Data melewati masa simpan dihapus'};
async function adminRequest<T>(path='', input?:unknown) {
  const {data} = await supabase.auth.getSession();
  if (!data.session) throw Error('Sesi admin berakhir. Silakan masuk kembali.');
  return petaRequest<T>('admin'+path, input ? 'POST' : 'GET', input, {Authorization:'Bearer '+data.session.access_token});
}

export function PetaAdmin() {
  const [data, setData] = useState<Dashboard|null>(null);
  const [error, setError] = useState(''), [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false), [loading, setLoading] = useState(true);
  const [selection, setSelection] = useState('all'), [view, setView] = useState<View>('participants');
  const [query, setQuery] = useState(''), [status, setStatus] = useState('all');
  const [scope, setScope] = useState<'active'|'history'>('active'), [page, setPage] = useState(0), [search, setSearch] = useState('');
  const initialized = useRef(false), requestNumber = useRef(0);
  const [reference, setReference] = useState(''), [approved, setApproved] = useState(false), [consultant, setConsultant] = useState(false);
  const [settingsDirty, setSettingsDirty] = useState(false);
  const [legacyWorkspace, setLegacyWorkspace] = useState(''), [code, setCode] = useState('');
  const [link, setLink] = useState(''), [linkExpiry, setLinkExpiry] = useState(''), [copied, setCopied] = useState(false);
  const [opened, setOpened] = useState<{session:Session; report:PetaReportData}|null>(null);
  const [pendingResult, setPendingResult] = useState('');
  const listHeading = useRef<HTMLHeadingElement>(null), returnToList = useRef(false);
  const programs = (data?.programs || []).filter(p => p.petaEnabled && ['active','in_progress'].includes(p.status));
  const program = programs.find(p => p.id === selection);
  const workspace = data?.workspaces.find(w => w.programId === selection || 'legacy:'+w.id === selection);
  const historyWorkspaces = (data?.workspaces || []).filter(w => !programs.some(p => p.id === w.programId));
  const scopeWorkspaces = scope === 'history' ? historyWorkspaces : (data?.workspaces || []).filter(w => programs.some(p => p.id === w.programId));
  const workspaceId = workspace?.id;
  const legacyWorkspaces = data?.workspaces.filter(w => !w.programId) || [];
  const sessions = (data?.sessions || []).filter(s => selection === 'all' ? scopeWorkspaces.some(w => w.id === s.workspaceId) : s.workspaceId === workspace?.id);
  const visible = sessions.filter(s => (status === 'all' || s.status === status) && `${s.participantName || ''} ${s.participantCode}`.toLocaleLowerCase('id-ID').includes(query.trim().toLocaleLowerCase('id-ID')));
  const scoped = <T extends {workspaceId:string}>(items:T[]) => items.filter(item => selection === 'all' ? scopeWorkspaces.some(w => w.id === item.workspaceId) : item.workspaceId === workspace?.id);
  const ready = Boolean(program?.petaEnabled && workspace && data?.sourceReady);
  const programOpen = Boolean(program && ['active', 'in_progress'].includes(program.status));
  const counts = data?.counts || {total:sessions.length,inProgress:sessions.filter(s => s.status === 'in_progress').length,submitted:sessions.filter(s => s.status === 'submitted').length};

  useEffect(() => {const timer = window.setTimeout(() => setSearch(query), 300); return () => window.clearTimeout(timer);}, [query]);
  useEffect(() => {
    if (!opened && returnToList.current) {listHeading.current?.focus(); returnToList.current = false;}
  }, [opened]);

  const load = useCallback(async () => {
    const current = ++requestNumber.current;
    setLoading(true);
    const params = new URLSearchParams({scope,page:String(page),search,status});
    if (workspaceId) params.set('workspace', workspaceId);
    try {
      const value = await adminRequest<Dashboard>('?'+params);
      if (current !== requestNumber.current) return;
      setData(value); setError('');
      if (value.total !== undefined && value.pageSize && page > 0 && page*value.pageSize >= value.total) setPage(Math.max(0,Math.ceil(value.total/value.pageSize)-1));
      if (!initialized.current) {
        initialized.current = true;
        const available = (value.programs || []).filter(p => p.petaEnabled && ['active','in_progress'].includes(p.status));
        const requested = new URLSearchParams(window.location.search).get('program_id') || (available.length === 1 ? available[0].id : null);
        const w = value.workspaces.find(w => w.programId === requested);
        if (requested && (w || available.some(p => p.id === requested))) {
          setSelection(requested); if (!available.some(p => p.id === requested)) setScope('history');
          setReference(w?.privacyReference || ''); setConsultant(w?.consultantAccess || false);
        }
      }
    }
    catch (e) {if (current === requestNumber.current) setError(e instanceof Error ? e.message : 'Data belum dapat dimuat. Coba muat ulang.');}
    finally {if (current === requestNumber.current) setLoading(false);}
  }, [scope,page,search,status,workspaceId]);
  useEffect(() => {
    let active = true;
    const requests = requestNumber;
    // Queue the external read; Strict Mode cleanup can cancel an obsolete mount.
    void Promise.resolve().then(() => {if (active) void load();});
    return () => {active = false; requests.current++;};
  }, [load]);
  function chooseProgram(value:string) {
    if (value !== selection && settingsDirty && !window.confirm('Pengaturan PETA belum disimpan. Ganti program dan abaikan perubahan?')) return;
    if (value !== selection) setLoading(true);
    setSelection(value); setQuery(''); setSearch(''); setPage(0); setStatus('all'); setSuccess(''); setError(''); setLink(''); setApproved(false);
    setSettingsDirty(false);
    const w = data?.workspaces.find(w => w.programId === value || 'legacy:'+w.id === value);
    setReference(w?.privacyReference || ''); setConsultant(w?.consultantAccess || false);
  }
  function chooseScope(value:'active'|'history') {
    if (scope === value) return;
    if (settingsDirty && !window.confirm('Pengaturan PETA belum disimpan. Ganti tampilan dan abaikan perubahan?')) return;
    setLoading(true); setScope(value); setSelection('all'); setPage(0); setQuery(''); setSearch(''); setStatus('all'); setView('participants'); setSettingsDirty(false); setSuccess(''); setLink('');
  }
  async function run(action:() => Promise<void>) {
    setBusy(true); setError(''); setSuccess('');
    try {await action();}
    catch (e) {setError(e instanceof Error ? e.message : 'Tindakan belum dapat diselesaikan. Silakan coba kembali.');}
    finally {setBusy(false);}
  }
  async function saveSettings() {
    await run(async () => {
      await adminRequest('/workspaces', {programId:program?.id, privacyReference:reference, consultantAccess:consultant, privacyApproved:approved, contentRightsConfirmed:approved, pilotAcknowledged:approved});
      setApproved(false); setSettingsDirty(false); await load(); setSuccess('Pengaturan PETA tersimpan. Buka Akses peserta untuk membagikan QR program.');
    });
  }
  async function invite() {
    await run(async () => {
      const result = await adminRequest<{invitationPath:string; expiresAt:string}>('/invitations', {workspaceId:legacyWorkspace, participantCode:code});
      setLink(new URL(result.invitationPath, window.location.origin).href); setLinkExpiry(result.expiresAt); setCopied(false); setCode(''); await load();
    });
  }
  async function sessionAction(s:Session, action:'result'|'recover'|'revoke'|'erase') {
    let verified = false;
    if (action === 'recover') {
      verified = window.confirm('Identitas peserta sudah Anda verifikasi melalui saluran yang disepakati? Tautan baru berlaku 30 menit dan menggantikan akses perangkat lama setelah digunakan.');
      if (!verified) return;
    }
    if (action === 'erase') {
      verified = window.prompt('Hapus jawaban dan hasil PETA dari penyimpanan utama? Tindakan ini tidak dapat dibatalkan. Ketik kode peserta: '+s.participantCode) === s.participantCode;
      if (!verified) return;
    }
    if (action === 'revoke' && !window.confirm('Cabut akses peserta '+s.participantCode+'? Peserta tidak dapat membuka sesi PETA ini. Data tersimpan tidak langsung dihapus.')) return;
    if (action === 'result') setPendingResult(s.id);
    await run(async () => {
      const result = await adminRequest<{report?:PetaReportData; invitationPath?:string; expiresAt?:string}>('/session-action', {id:s.id, action, verified});
      if (action === 'result') {
        if (!result.report) throw Error('Hasil peserta belum dapat ditampilkan. Silakan coba kembali.');
        setOpened({session:s, report:result.report});
      }
      if (result.invitationPath) {setLink(new URL(result.invitationPath, window.location.origin).href); setLinkExpiry(result.expiresAt || ''); setCopied(false);}
      if (action === 'erase' || action === 'revoke') setSuccess(action === 'erase' ? 'Data PETA peserta telah dihapus.' : 'Akses sesi PETA peserta telah dicabut.');
      await load();
    });
    setPendingResult('');
  }
  const messages = <>
    {error && <div role="alert" className={styles.error}><p>{error}</p><button type="button" className={styles.linkButton} onClick={() => void load()} disabled={loading || busy}>Muat ulang data</button></div>}
    {success && <p role="status" className={styles.success}>{success}</p>}
  </>;

  if (opened) return <div className={styles.admin}>
    <button className={styles.back} onClick={() => {returnToList.current = true; setOpened(null); setSuccess('');}}><ArrowLeft size={16} aria-hidden="true"/>Kembali ke daftar peserta</button>
    <div className={styles.resultIdentity}><h2>Hasil {opened.session.participantName || opened.session.participantCode}</h2><p>Ditinjau sebagai admin pendamping, sesuai izin peserta.</p><PetaPDFDownload target={{kind:'individual',sessionId:opened.session.id}}/></div>
    {messages}<PetaReport report={opened.report} headingLevel={2}/>
  </div>;

  return <div className={styles.admin}>
    <nav className={styles.views} aria-label="Status program PETA"><button type="button" aria-pressed={scope === 'active'} onClick={() => chooseScope('active')} disabled={busy}>Program aktif</button><button type="button" aria-pressed={scope === 'history'} onClick={() => chooseScope('history')} disabled={busy}>Riwayat program</button></nav>
    {scope === 'history' && <p className={styles.footnote}>Riwayat PETA tetap tersimpan meskipun program selesai atau modul dinonaktifkan, selama masa simpan satu tahun. Izin peserta tetap berlaku untuk peninjauan hasil.</p>}
    <div className={styles.toolbar}>
      <label className={styles.programPicker}>Program<select value={selection} onChange={e => chooseProgram(e.target.value)} disabled={busy || !data}>
        <option value="all">{scope === 'active' ? 'Semua program PETA aktif' : 'Semua riwayat program'}</option>
        {scope === 'active' ? programs.map(p => <option key={p.id} value={p.id}>{p.title}</option>) : historyWorkspaces.map(w => <option key={w.id} value={w.programId || 'legacy:'+w.id}>{w.programId ? w.name : 'Pilot lama · '+w.name}</option>)}
      </select></label>
      <button className={styles.secondary} aria-label={loading ? 'Memuat data' : 'Perbarui data'} onClick={() => void load()} disabled={loading || busy}><RefreshCw size={15} aria-hidden="true"/><span>{loading ? 'Memuat…' : 'Perbarui data'}</span></button>
    </div>
    {messages}
    {loading && !data && <div className={styles.loading} role="status"><p>Memuat program dan pengisian peserta…</p><div/><div/><div/></div>}
    {!loading && !data && <p className={styles.empty}>Daftar PETA belum tersedia. Muat ulang data untuk mencoba kembali.</p>}
    {data && <>
      {!data.sourceReady && <div className={styles.warning}><strong>PETA belum siap menerima pengisian baru.</strong><p>Konfigurasi sistem perlu diperiksa. Data yang sudah ada tetap dapat dikelola.</p><details><summary>Detail untuk pengelola sistem</summary><p>Periksa sumber terenkripsi, kunci runtime API, SQL 76/76B dan SQL 77 sesuai panduan PETA.</p></details></div>}
      {program && <div className={styles.programContext}><div><h2>{program.title}</h2><p>{ready ? programOpen ? 'PETA siap digunakan. Bagikan akses program atau pantau pengisian peserta.' : 'Pengaturan PETA siap. Aktifkan program agar peserta dapat masuk.' : !program.petaEnabled ? 'Modul PETA belum diaktifkan pada program ini.' : 'Selesaikan pengaturan PETA sebelum membagikan akses peserta.'}</p></div><span className={ready && programOpen ? styles.badgeReady : styles.badge}>{ready ? programOpen ? 'Siap digunakan' : 'Program belum aktif' : 'Perlu pengaturan'}</span></div>}
      <nav className={styles.views} aria-label="Pengelolaan PETA">
        {([{id:'participants', label:'Peserta'}, {id:'reports', label:'Laporan grup'}, {id:'access', label:'Akses peserta'}, {id:'settings', label:'Pengaturan'}] as const).filter(item => scope === 'active' || item.id !== 'access').map(item => <button key={item.id} type="button" aria-pressed={view === item.id} onClick={() => {setView(item.id); setSuccess('');}}>{item.label}</button>)}
      </nav>
      {view === 'reports' && <PetaGroupReport key={workspaceId||'none'} workspaceId={workspaceId}/>}
      {view === 'participants' && <section className={styles.participants} aria-labelledby="peta-participants-title" aria-busy={loading}>
        <div className={styles.sectionHeading}><div><h2 ref={listHeading} tabIndex={-1} id="peta-participants-title">Pengisian peserta</h2><p>{scope === 'history' ? 'Pilih program untuk meninjau pengisian dan hasil peserta yang tersimpan.' : 'Peserta muncul setelah menyetujui penggunaan data dan memulai PETA.'}</p></div>{scope === 'active' && <button className={styles.secondary} onClick={() => setView('access')}>Bagikan akses<ArrowRight size={15} aria-hidden="true"/></button>}</div>
        <dl className={styles.counts} aria-label="Ringkasan pengisian"><div><dt>Pengisian tercatat</dt><dd>{counts.total}</dd></div><div><dt>Sedang diisi</dt><dd>{counts.inProgress}</dd></div><div><dt>Selesai</dt><dd>{counts.submitted}</dd></div></dl>
        {counts.total > 0 && <div className={styles.filters}>
          <label className={styles.search}><span>Cari peserta</span><div><Search size={16} aria-hidden="true"/><input type="search" maxLength={150} placeholder="Nama atau kode peserta" value={query} onChange={e => {setQuery(e.target.value); setPage(0);}}/></div></label>
          <label>Status pengisian<select value={status} onChange={e => {setStatus(e.target.value); setPage(0);}}><option value="all">Semua status</option><option value="in_progress">Sedang diisi</option><option value="submitted">Selesai</option><option value="revoked">Akses dicabut</option><option value="expired">Kedaluwarsa</option></select></label>
        </div>}
        {!counts.total ? <div className={styles.empty}><h3>Belum ada pengisian peserta</h3><p>{scope === 'history' ? 'Belum ada riwayat pengisian pada pilihan program ini.' : 'Pilih program, lalu buka Akses peserta untuk membagikan QR atau tautan program.'}</p></div>
          : !visible.length ? <div className={styles.empty}><h3>Peserta tidak ditemukan</h3><p>Coba nama atau kode lain, atau tampilkan kembali semua status.</p><button className={styles.secondary} onClick={() => {setQuery(''); setSearch(''); setStatus('all'); setPage(0);}}>Hapus pencarian dan filter</button></div>
          : <><div className={styles.listHeader} aria-hidden="true"><span>Peserta</span><span>Pengisian</span><span>Hasil & tindakan</span></div><ul className={styles.participantList}>{visible.map(s => <li key={s.id}>
            <div className={styles.person}><h3>{s.participantName || s.participantCode}</h3><p>{s.participantName ? s.participantCode : 'Peserta PETA'}{selection === 'all' ? ' · '+(data.workspaces.find(w => w.id === s.workspaceId)?.name || 'Program PETA') : ''}</p><details className={styles.metadata}><summary>Detail pengisian<ChevronDown size={13} aria-hidden="true"/></summary><dl><div><dt>Persetujuan dicatat</dt><dd>{petaDate(s.consentedAt)}</dd></div><div><dt>Batas simpan</dt><dd>{petaDate(s.retentionUntil)}</dd></div><div><dt>Versi instrumen</dt><dd>{s.instrumentVersion}</dd></div><div><dt>Versi persetujuan</dt><dd>{s.consentVersion}</dd></div></dl></details></div>
            <div className={styles.completion}><span className={s.status === 'submitted' ? styles.badgeReady : styles.badge}>{statusText[s.status] || 'Status belum tersedia'}</span><p>{s.completedBlocks} dari 24 situasi</p><progress value={s.completedBlocks} max={24} aria-label={'Kelengkapan pengisian '+(s.participantName || s.participantCode)}/></div>
            <div className={styles.rowActions}>
              {s.canReadResult ? <button className={styles.primary} disabled={busy} onClick={() => void sessionAction(s, 'result')}>{pendingResult === s.id ? 'Membuka hasil…' : 'Lihat hasil peserta'}<ArrowRight size={14} aria-hidden="true"/></button>
                : s.status === 'submitted' ? <p className={styles.permission}>{s.reviewConsent ? 'Hasil belum dapat dibuka. Periksa status akses dan masa simpan peserta.' : 'Peserta belum memberikan izin untuk peninjauan hasil.'}</p>
                : <p className={styles.permission}>{s.status === 'in_progress' ? 'Hasil tersedia setelah peserta mengirim seluruh jawaban.' : 'Hasil belum dapat dibuka.'}</p>}
              <details className={styles.manage}><summary>Kelola peserta<ChevronDown size={14} aria-hidden="true"/></summary><div>
                {!['expired', 'revoked'].includes(s.status) && <>{s.programId ? <Link href={'/admin/engagements/access-codes?engagement_id='+s.programId}>Kelola kode peserta</Link> : <button disabled={busy} onClick={() => void sessionAction(s, 'recover')}>Pulihkan akses</button>}<button disabled={busy} onClick={() => void sessionAction(s, 'revoke')}>Cabut akses PETA</button></>}
                <button className={styles.destructive} disabled={busy} onClick={() => void sessionAction(s, 'erase')}>Hapus data PETA</button>
              </div></details>
            </div>
          </li>)}</ul></>}
        {data.total !== undefined && data.pageSize && data.total > data.pageSize && <nav className={styles.pagination} aria-label="Halaman peserta"><button className={styles.secondary} disabled={loading || page === 0} onClick={() => setPage(page-1)}>Sebelumnya</button><span role="status">Halaman {page+1} dari {Math.ceil(data.total/data.pageSize)} · {data.total} pengisian</span><button className={styles.secondary} disabled={loading || (page+1)*data.pageSize >= data.total} onClick={() => setPage(page+1)}>Berikutnya</button></nav>}
        <p className={styles.footnote}>Semua admin BinaHub dapat mengelola pengisian PETA. Ringkasan menghitung peserta yang sudah memulai PETA, bukan seluruh peserta terdaftar dalam program. Hasil pribadi hanya dapat dibuka jika peserta memberikan izin peninjauan.</p>
      </section>}
      {view === 'access' && <section className={styles.access} aria-labelledby="peta-access-title"><h2 id="peta-access-title">Akses peserta</h2><p>Gunakan QR dan kode program yang sama. Tidak perlu membuat undangan PETA satu per satu.</p>
        {!program ? <div className={styles.empty}><h3>Pilih program terlebih dahulu</h3><p>Pilih satu program di bagian atas untuk menampilkan QR dan tautan aksesnya.</p><Link className={styles.secondary} href="/admin/engagements/new">Buat program baru</Link></div>
          : !ready ? <div className={styles.empty}><h3>Siapkan PETA sebelum membagikan akses</h3><p>{!program.petaEnabled ? 'Aktifkan modul PETA melalui Kelola program, lalu lengkapi pengaturannya di sini.' : 'Simpan pengaturan PETA dan pastikan konfigurasi sistem siap.'}</p><button className={styles.primary} onClick={() => setView('settings')}>Buka pengaturan PETA<ArrowRight size={15} aria-hidden="true"/></button></div>
          : <div className={styles.accessLayout}><ProgramShareCard key={program.id} programId={program.id} code={program.code} title={program.title} status={program.status}/><aside><h3>Bagaimana peserta masuk?</h3><ol><li>Pindai QR atau buka tautan program.</li><li>Daftar atau masuk dengan kode peserta pribadi.</li><li>Buka modul PETA, lalu ikuti petunjuk pengisian.</li></ol><p>QR dan kode program tidak membuka hasil peserta lain. Hasil pribadi dapat ditinjau tim admin pendamping BinaHub jika peserta memberi izin.</p><Link className={styles.linkButton} href={'/admin/engagements/manage?id='+program.id}>Kelola program & peserta<ArrowRight size={14} aria-hidden="true"/></Link></aside></div>}
      </section>}
      {view === 'settings' && <section className={styles.settings} aria-labelledby="peta-settings-title"><h2 id="peta-settings-title">Pengaturan PETA</h2><p>Siapkan sekali untuk setiap program. Izin peninjauan hasil tetap ditentukan oleh peserta.</p>
        {program ? <form className={styles.settingsForm} onSubmit={e => {e.preventDefault(); void saveSettings();}}>
          {!program.petaEnabled && <p className={styles.warning}>Modul PETA belum aktif. <Link className={styles.linkButton} href={'/admin/engagements/manage?id='+program.id}>Aktifkan melalui Kelola program</Link> sebelum menyimpan pengaturan.</p>}
          <label>Acuan pemberitahuan privasi<textarea value={reference} onChange={e => {setReference(e.target.value); setSettingsDirty(true);}} minLength={10} maxLength={500} rows={3} required aria-describedby="peta-reference-help" placeholder="Contoh: Kebijakan PETA program internal, disetujui 30 Oktober 2026"/></label><p id="peta-reference-help" className={styles.help}>Catatan internal tentang kebijakan yang digunakan dalam program ini, bukan instruksi pengisian peserta.</p>
          <label className={styles.check}><input type="checkbox" checked={consultant} onChange={e => {setConsultant(e.target.checked); setSettingsDirty(true);}}/><span>Aktifkan peninjauan hasil oleh tim admin pendamping BinaHub.<small>Semua admin dapat meninjau hasil jika peserta memberikan izin. Perubahan ini tidak mengubah izin pada pengisian yang sudah ada.</small></span></label>
          <label className={styles.check}><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)}/><span>Saya memastikan hak penggunaan konten dan pemberitahuan privasi telah disetujui, serta memahami status pilot dan masa simpan satu tahun. Ini bukan pengesahan validitas psikometrik.</span></label>
          <div><button type="submit" className={styles.primary} disabled={busy || !approved || !program.petaEnabled || !data.sourceReady}>{busy ? 'Menyimpan…' : 'Simpan pengaturan PETA'}</button>{!approved && <p className={styles.help}>Konfirmasikan persetujuan di atas untuk menyimpan pengaturan.</p>}</div>
        </form> : scope === 'history' ? <p className={styles.footnote}>Pengaturan dan izin pada pengisian lama tetap dipertahankan. Program yang selesai tidak menerima pengisian baru dari halaman riwayat.</p> : <div className={styles.empty}><h3>Pilih program yang akan disiapkan</h3><p>Gunakan pilihan program di atas. Jika program belum ada, buat program dan aktifkan modul PETA.</p><Link className={styles.secondary} href="/admin/engagements/new">Buat program baru</Link></div>}
        {legacyWorkspaces.length > 0 && <details className={styles.history}><summary>Undangan pilot lama<ChevronDown size={16} aria-hidden="true"/></summary><p>Untuk melanjutkan pilot sebelum PETA menjadi modul program. Data lama tidak dipindahkan otomatis.</p><form className={styles.settingsForm} onSubmit={e => {e.preventDefault(); void invite();}}><label>Ruang pilot lama<select value={legacyWorkspace} onChange={e => setLegacyWorkspace(e.target.value)} required><option value="">Pilih ruang lama</option>{legacyWorkspaces.map(w => <option value={w.id} key={w.id}>{w.name}</option>)}</select></label><label>Kode peserta<input value={code} onChange={e => setCode(e.target.value)} pattern="[A-Za-z0-9_-]{1,64}" maxLength={64} required placeholder="Contoh: PETA-7R2K"/></label><div><button type="submit" className={styles.secondary} disabled={busy || !legacyWorkspace || !data.sourceReady}>Buat tautan undangan</button></div></form></details>}
        <details className={styles.history}><summary>Riwayat undangan terbaru<ChevronDown size={16} aria-hidden="true"/></summary>{!scoped(data.invitations).length ? <p>Belum ada undangan pada pilihan program ini.</p> : <ul>{scoped(data.invitations).map(i => <li key={i.id}><strong>{i.participantCode} · {statusText[i.status] || 'Status belum tersedia'}</strong><p>{i.purpose === 'resume' ? 'Pemulihan' : 'Undangan awal'} · Berlaku sampai {petaDate(i.expiresAt)}</p>{i.status === 'invited' && <button className={styles.linkButton} disabled={busy} onClick={() => {if (window.confirm('Cabut undangan '+i.participantCode+'?')) void run(async () => {await adminRequest('/invitation-revoke', {id:i.id}); await load(); setSuccess('Undangan telah dicabut.');});}}>Cabut undangan</button>}</li>)}</ul>}</details>
        <details className={styles.history}><summary>Riwayat akses dan tindakan<ChevronDown size={16} aria-hidden="true"/></summary><p>Maksimal 100 kejadian terbaru. Tidak memuat isi jawaban, hasil, atau token.</p>{!scoped(data.audit || []).length ? <p>Belum ada catatan akses pada pilihan program ini.</p> : <ul>{scoped(data.audit || []).map(a => <li key={a.id}><strong>{eventText[a.event] || 'Kejadian PETA'}</strong><p>{new Date(a.createdAt).toLocaleString('id-ID')}{a.participantCode ? ' · '+a.participantCode : ''}{a.adminAction ? ' · oleh admin' : ''}</p></li>)}</ul>}</details>
        <details className={styles.history}><summary>Penyimpanan dan penghapusan data<ChevronDown size={16} aria-hidden="true"/></summary><p>Jawaban dan hasil disimpan satu tahun sejak persetujuan awal. Akses data yang melewati masa tersebut ditolak. Pembersihan penyimpanan utama dilakukan worker terjadwal; penghapusan backup mengikuti kebijakan operator.</p></details>
      </section>}
      {link && <section className={styles.newLink} aria-label="Tautan pribadi baru" role="status"><h2>Tautan pribadi siap dibagikan</h2><p>Jangan bagikan di grup atau saluran publik. Tautan hanya tampil selama halaman ini terbuka.</p><div className={styles.linkOutput}>{link}</div><p>{linkExpiry ? 'Berlaku sampai '+new Date(linkExpiry).toLocaleString('id-ID') : ''}</p><div className={styles.linkActions}><button className={styles.secondary} onClick={() => void navigator.clipboard.writeText(link).then(() => setCopied(true)).catch(() => setError('Clipboard tidak tersedia. Salin manual tautan yang tampil.'))}><Copy size={15} aria-hidden="true"/>{copied ? 'Tersalin' : 'Salin tautan'}</button><button className={styles.linkButton} onClick={() => setLink('')}>Tutup tautan</button></div></section>}
    </>}
  </div>;
}

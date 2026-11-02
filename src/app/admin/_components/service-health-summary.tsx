import type { ServiceHealth, HealthQueue } from "@/lib/service-health-contract";
import { queueLabels } from "@/lib/service-health-contract";

const time = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " WIB"
    : "Belum tercatat";
const workerLabels = {
  never_seen: "Belum ada aktivitas tercatat",
  running: "Pemroses sedang berjalan",
  recent: "Pemroses baru selesai",
  stale: "Aktivitas terakhir sudah lama",
  degraded: "Ada tahap yang tertunda / gagal",
  failed: "Pemroses terakhir gagal",
};
const counts: [
  keyof Pick<
    HealthQueue,
    "pending" | "processing" | "overdue" | "stalled" | "review"
  >,
  string,
][] = [
  ["pending", "Menunggu"],
  ["processing", "Berjalan"],
  ["overdue", "Terlambat"],
  ["stalled", "Melewati batas proses"],
  ["review", "Perlu ditinjau"],
];

export function ServiceHealthSummary({
  health,
  error,
  loading,
  onRefresh,
  disabled,
}: {
  health: ServiceHealth | null;
  error: string;
  loading: boolean;
  onRefresh: () => void;
  disabled: boolean;
}) {
  return (
    <section
      aria-labelledby="service-health-heading"
      className="mb-6 rounded-2xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2
          id="service-health-heading"
          className="text-lg font-semibold text-blue-950"
        >
          Kesiapan layanan &amp; antrean laporan
        </h2>
        <button
          type="button"
          disabled={disabled}
          onClick={onRefresh}
          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-blue-950 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-900 disabled:opacity-60"
        >
          {loading ? "Memperbarui…" : "Perbarui status"}
        </button>
      </div>
      <p className="mt-1 max-w-prose text-sm leading-relaxed text-slate-600">
        API yang merespons belum tentu siap memproses laporan. Pemeriksaan ini
        membaca status database dan antrean, tanpa menjalankan AI atau mengirim
        email.
      </p>
      {error && (
        <p role="status" className="mt-4 text-sm text-red-800">
          {error}
        </p>
      )}
      {!health && !error && (
        <p role="status" className="mt-4 text-sm text-slate-600">
          {loading ? "Memeriksa kesiapan layanan…" : "Status belum tersedia."}
        </p>
      )}
      {health && health.readiness !== "ready" && (
        <p className="mt-4 text-sm text-amber-900">
          {health.readiness === "setup_required"
            ? "Pembaruan monitoring belum tersedia. Periksa deployment API dan SQL81."
            : "Database atau bukti monitoring belum dapat dibaca. Perbarui status untuk mencoba kembali."}{" "}
          Status tidak dianggap sehat sampai pemeriksaan berhasil.
        </p>
      )}
      {health?.readiness === "ready" && (
        <>
          <dl className="mt-5 grid gap-x-8 gap-y-5 border-y border-slate-200 py-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-slate-600">Koneksi database</dt>
              <dd className="mt-1 font-semibold text-emerald-800">
                Siap dibaca
              </dd>
            </div>
            <div>
              <dt className="text-sm text-slate-600">Pemroses laporan</dt>
              <dd
                className={`mt-1 font-semibold ${health.operations === "healthy" ? "text-blue-950" : "text-amber-900"}`}
              >
                {workerLabels[health.worker.state]}
              </dd>
              <dd className="mt-1 text-sm text-slate-600">
                Mulai terakhir: {time(health.worker.startedAt)}
              </dd>
            </div>
          </dl>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            {health.worker.state === "never_seen"
              ? "Belum ada bukti pemulihan rutin. Jadwal pemulihan masih menunggu migrasi Vercel; pekerjaan awal dapat tetap diproses saat formulir dikirim."
              : "Catatan aktivitas membuktikan pemroses dipanggil, bukan bukti seluruh email sudah diterima klien."}
          </p>
          <div className="mt-5 hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Ringkasan antrean laporan, tanpa identitas peserta
              </caption>
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th scope="col" className="py-3 pr-4 font-medium">
                    Antrean
                  </th>
                  {counts.map(([key, label]) => (
                    <th
                      scope="col"
                      key={key}
                      className="px-3 py-3 text-right font-medium"
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {health.queues.map((queue) => (
                  <tr key={queue.key}>
                    <th
                      scope="row"
                      className="py-4 pr-4 font-medium text-blue-950"
                    >
                      {queueLabels[queue.key]}
                      <span className="mt-1 block text-xs font-normal text-slate-600">
                        {queue.oldestDueAt
                          ? "Siap diproses sejak: " + time(queue.oldestDueAt)
                          : "Tidak ada pekerjaan yang jatuh jadwal."}
                      </span>
                    </th>
                    {counts.map(([key]) => (
                      <td
                        key={key}
                        className={`px-3 py-4 text-right tabular-nums ${["overdue", "stalled", "review"].includes(key) && queue[key] > 0 ? "font-semibold text-amber-900" : "text-slate-700"}`}
                      >
                        {queue[key].toLocaleString("id-ID")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-5 divide-y divide-slate-200 md:hidden">
            {health.queues.map((queue) => (
              <article key={queue.key} className="py-4">
                <h3 className="font-medium text-blue-950">
                  {queueLabels[queue.key]}
                </h3>
                <dl className="mt-3 grid grid-cols-2 gap-3 min-[380px]:grid-cols-3">
                  {counts.map(([key, label]) => (
                    <div key={key}>
                      <dt className="text-xs text-slate-600">{label}</dt>
                      <dd
                        className={`mt-1 text-base font-semibold tabular-nums ${["overdue", "stalled", "review"].includes(key) && queue[key] > 0 ? "text-amber-900" : "text-blue-950"}`}
                      >
                        {queue[key].toLocaleString("id-ID")}
                      </dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-slate-600">
                  {queue.oldestDueAt
                    ? "Siap diproses sejak: " + time(queue.oldestDueAt)
                    : "Tidak ada pekerjaan yang jatuh jadwal."}
                </p>
              </article>
            ))}
          </div>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Terlambat: jadwal pemrosesan terlewati lebih dari{" "}
            {health.overdueMinutes} menit. Melewati batas proses: batas waktu
            pemrosesan berakhir atau proses tim tidak diperbarui selama 20
            menit. Perlu ditinjau: gagal atau hasil pengiriman belum pasti;
            jangan kirim ulang sebelum rekonsiliasi.
          </p>
          <p className="mt-3 text-xs text-slate-600">
            Diperiksa: {time(health.checkedAt)}. Provider AI/email tidak diuji.
            Alarm hanya di dashboard saat dibuka; email/WhatsApp alarm belum
            aktif.
          </p>
        </>
      )}
    </section>
  );
}

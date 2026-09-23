"use client";

import { useId, useState } from "react";
import {
  ArrowRight,
  Bell,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  HelpCircle,
  Inbox,
  Search,
  ShieldCheck,
  Trash2,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ConfirmAction } from "../_lib/types";
import { useDialogFocus } from "@/hooks/use-dialog-focus";

export function AdminSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10"
      />
    </div>
  );
}

export function HrmList<T>({
  items,
  empty,
  render,
}: {
  items: T[];
  empty: string;
  render: (item: T) => React.ReactNode;
}) {
  if (!items.length) {
    return <EmptyState title={empty} description="Data akan tampil di sini setelah disimpan dari form modul terkait." />;
  }

  return <div className="space-y-3">{items.slice(0, 8).map((item, index) => <div key={index}>{render(item)}</div>)}</div>;
}

export function CollapsibleModule({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-2xs">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex w-full items-center justify-between px-4 py-3.5 text-left text-sm font-semibold text-slate-900 transition hover:text-[#0B2C6B]"
      >
        {title}
        <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div id={contentId} className="border-t border-slate-100 p-4">{children}</div>}
    </div>
  );
}

export function HrmItem({
  title,
  meta,
  detail,
  onDelete,
}: {
  title: string;
  meta: string;
  detail?: string | null;
  onDelete?: () => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">{meta}</p>
        </div>
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-rose-100 bg-rose-50 text-rose-600 transition hover:bg-rose-100"
            aria-label={`Hapus ${title}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {detail && <p className="mt-2.5 text-xs leading-relaxed text-slate-600">{detail}</p>}
    </div>
  );
}

export function AdminSelect({
  value,
  onChange,
  options,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<string | [string, string]>;
  ariaLabel?: string;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      aria-label={ariaLabel}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-800 outline-none transition hover:border-slate-300 focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10"
    >
      {options.map((option) => {
        const optionValue = Array.isArray(option) ? option[0] : option;
        const label = Array.isArray(option) ? option[1] : option;
        return (
          <option key={optionValue} value={optionValue}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

export function AdminInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  help,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        {label}
        {help ? <HelpTooltip content={help} /> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10"
      />
    </label>
  );
}

export function AdminTextarea({
  label,
  value,
  onChange,
  placeholder,
  help,
  minHeight = "min-h-24",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
  minHeight?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
        {label}
        {help ? <HelpTooltip content={help} /> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${minHeight} w-full rounded-xl border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition hover:border-slate-300 focus:border-[#0B2C6B] focus:ring-2 focus:ring-[#0B2C6B]/10`}
      />
    </label>
  );
}

export function HelpTooltip({ content }: { content: string }) {
  const tooltipId = useId();
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        role="img"
        title={content}
        aria-describedby={tooltipId}
        aria-label="Bantuan kolom"
        className="grid h-4 w-4 cursor-help place-items-center rounded-full text-slate-400 outline-none transition hover:text-[#0B2C6B] focus:text-[#0B2C6B]"
      >
        <HelpCircle size={13} aria-hidden="true" />
      </span>
      <span id={tooltipId} role="tooltip" className="pointer-events-none absolute left-1/2 top-6 z-40 hidden w-64 -translate-x-1/2 rounded-xl border border-slate-800 bg-[#071B3D] px-3 py-2 text-xs font-medium normal-case leading-relaxed text-white shadow-xl group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}

export function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-700">
      {label}
      {help ? <HelpTooltip content={help} /> : null}
    </span>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-2xs">
      <div className="mb-3.5">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function PresetButtons({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:border-[#D9A441] hover:bg-[#FFF8EA] hover:text-[#8C6512]"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "navy" }: { children: React.ReactNode; tone?: "navy" | "gold" | "green" | "red" }) {
  const toneClass = {
    navy: "border border-[#0B2C6B]/15 bg-[#0B2C6B]/5 text-[#0B2C6B]",
    gold: "border border-[#D9A441]/30 bg-[#FFF8EA] text-[#8C6512]",
    green: "border border-emerald-200/60 bg-emerald-50 text-emerald-700",
    red: "border border-rose-200/60 bg-rose-50 text-rose-700",
  }[tone];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium tracking-normal ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  return (
    <span className="min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-xs">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "gold" | "danger" | "success";
}) {
  const toneClass = {
    default: "bg-[#0B2C6B]/[0.06] text-[#0B2C6B]",
    gold: "bg-[#D9A441]/15 text-[#8C6512]",
    danger: "bg-rose-50 text-rose-700",
    success: "bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:border-[#D9A441]/40">
      {Icon ? (
        <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${toneClass}`}>
          <Icon size={18} />
        </div>
      ) : null}
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
    </div>
  );
}

export function CompactStatusPill({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  tone?: "default" | "gold" | "danger" | "success";
}) {
  const hasValue = Number(value) > 0;
  const toneClass = {
    default: "border-slate-200 bg-slate-50/80 text-[#0B2C6B]",
    gold: "border-[#D9A441]/30 bg-[#FFF8EA] text-[#8C6512]",
    danger: "border-rose-200 bg-rose-50 text-rose-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className={`relative flex h-8 items-center gap-2 rounded-xl border px-2.5 text-xs font-semibold ${toneClass}`}>
      <Icon size={14} className="shrink-0" />
      <span className="text-xs font-medium text-slate-600">{label}</span>
      {hasValue ? (
        <span className="rounded-full bg-[#0B2C6B] px-1.5 py-0.2 text-[10px] font-bold leading-none text-white">
          {Number(value) > 99 ? "99+" : value}
        </span>
      ) : (
        <span className="text-xs font-medium text-slate-400">0</span>
      )}
    </div>
  );
}

export function ModuleHero({
  eyebrow,
  title,
  description,
  stats = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  stats?: Array<{ label: string; value: string | number }>;
}) {
  const statIcons: Record<string, LucideIcon> = {
    "Assessment baru": Bell,
    "Inquiry baru": Inbox,
    "Smart action": Bot,
    "Project aktif": BriefcaseBusiness,
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#C58D27]">{eyebrow}</p>
          <h2 className="mt-1 text-xl sm:text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
          <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-500">{description}</p>
        </div>
        {stats.length ? (
          <div className="flex flex-wrap gap-2 lg:max-w-[430px] lg:justify-end">
            {stats.slice(0, 4).map((stat) => (
              <CompactStatusPill key={stat.label} label={stat.label} value={stat.value} icon={statIcons[stat.label] || ShieldCheck} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-8 text-center">
      <ShieldCheck className="mx-auto mb-3 text-[#D9A441]" size={30} />
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mx-auto mt-4 inline-flex h-9 items-center gap-2 rounded-xl bg-[#0B2C6B] px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-[#071B3D]"
        >
          {action.label} <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function ConfirmDialog({ action, onClose }: { action: ConfirmAction; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose, submitting);
  const titleId = useId();
  const descriptionId = useId();
  const buttonClass =
    action.tone === "danger"
      ? "bg-rose-600 text-white hover:bg-rose-700"
      : action.tone === "gold"
        ? "bg-[#D9A441] text-[#071B3D] hover:bg-[#C58D27]"
        : "bg-[#0B2C6B] text-white hover:bg-[#071B3D]";

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await action.onConfirm();
      setSubmitting(false);
      onClose();
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={submitting} className="w-full max-w-lg rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#C58D27]">Review Aksi</p>
            <h2 id={titleId} className="mt-1 text-lg font-bold tracking-tight text-slate-900">{action.title}</h2>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            disabled={submitting}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            aria-label="Tutup dialog konfirmasi"
          >
            <X size={16} />
          </button>
        </div>
        <p id={descriptionId} className="text-sm leading-relaxed text-slate-600">{action.description}</p>
        {action.details?.length ? (
          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="mb-2 text-xs font-semibold text-slate-700">Yang akan diproses</p>
            <div className="space-y-1.5">
              {action.details.map((detail) => (
                <p key={detail} className="text-xs leading-relaxed text-slate-600">{detail}</p>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={`h-10 rounded-xl px-4 text-xs font-semibold shadow-xs transition disabled:opacity-50 ${buttonClass}`}
          >
            {submitting ? "Memproses..." : action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminNotice({ children }: { children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" className="mb-4 rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-3 text-xs sm:text-sm font-medium text-rose-800">
      {children}
    </div>
  );
}

export function AdminModal({
  title,
  eyebrow,
  children,
  onClose,
  maxWidth = "max-w-6xl",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  onClose: () => void;
  maxWidth?: string;
}) {
  const dialogRef = useDialogFocus<HTMLDivElement>(onClose);
  const titleId = useId();
  return (
    <div className="fixed inset-0 z-[55] bg-slate-950/45 px-4 py-6 backdrop-blur-sm">
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} className={`mx-auto flex h-full w-full ${maxWidth} flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/80 px-6 py-4">
          <div>
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-wider text-[#C58D27]">{eyebrow}</p>}
            <h2 id={titleId} className="mt-1 text-lg font-bold tracking-tight text-slate-900">{title}</h2>
          </div>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Tutup modal"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 md:p-6">{children}</div>
      </div>
    </div>
  );
}

export function Panel({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs md:p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="text-base font-bold tracking-tight text-slate-900">{title}</h3>
        {action && <span className="text-xs font-medium text-slate-400">{action}</span>}
      </div>
      {children}
    </section>
  );
}

export function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs sm:text-sm">
        <span className="font-medium text-slate-700">{label}</span>
        <span className="font-bold text-[#0B2C6B]">{value}%</span>
      </div>
      <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(Math.max(value, 0), 100)} className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-[#0B2C6B] transition-all duration-300" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div role="status" aria-live="polite" aria-label="Memuat dashboard admin" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <span className="sr-only">Memuat dashboard admin...</span>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl border border-slate-200/80 bg-white shadow-xs" />
      ))}
    </div>
  );
}

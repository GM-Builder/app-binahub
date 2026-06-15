"use client";

import { useState } from "react";
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
      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[12px] border border-black/10 bg-white pl-11 pr-4 text-sm outline-none focus:border-[#D9A441]"
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

  return (
    <div className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB]">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-semibold text-[#0B2C6B]"
      >
        {title}
        <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="border-t border-black/[0.05] p-4">{children}</div>}
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
    <div className="rounded-[10px] border border-black/[0.05] bg-[#FCFCFB] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0B2C6B]">{title}</p>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.12em] text-black/34">{meta}</p>
        </div>
        {onDelete && (
          <button
            onClick={onDelete}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] border border-red-100 bg-red-50 text-red-600"
            aria-label={`Hapus ${title}`}
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
      {detail && <p className="mt-3 text-xs leading-relaxed text-black/50">{detail}</p>}
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
      className="h-12 w-full rounded-[12px] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#D9A441]"
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
      <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">
        {label}
        {help ? <HelpTooltip content={help} /> : null}
      </span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-11 w-full rounded-[10px] border border-black/10 bg-white px-3 text-sm outline-none focus:border-[#D9A441]"
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
      <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">
        {label}
        {help ? <HelpTooltip content={help} /> : null}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={`${minHeight} w-full rounded-[10px] border border-black/10 bg-white px-3 py-3 text-sm outline-none focus:border-[#D9A441]`}
      />
    </label>
  );
}

export function HelpTooltip({ content }: { content: string }) {
  return (
    <span className="group relative inline-flex">
      <span
        tabIndex={0}
        title={content}
        className="grid h-4 w-4 cursor-help place-items-center rounded-full text-black/34 outline-none transition hover:text-[#0B2C6B] focus:text-[#0B2C6B]"
        aria-label={content}
      >
        <HelpCircle size={13} />
      </span>
      <span className="pointer-events-none absolute left-1/2 top-6 z-40 hidden w-64 -translate-x-1/2 rounded-[10px] border border-black/10 bg-[#071B3D] px-3 py-2 text-[11px] font-medium normal-case leading-relaxed tracking-normal text-white shadow-[0_18px_45px_-22px_rgba(7,27,61,0.75)] group-hover:block group-focus-within:block">
        {content}
      </span>
    </span>
  );
}

export function FieldLabel({ label, help }: { label: string; help?: string }) {
  return (
    <span className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-black/36">
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
    <div className="rounded-[12px] border border-black/[0.05] bg-[#FCFCFB] p-4">
      <div className="mb-4">
        <p className="text-sm font-semibold text-[#0B2C6B]">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-black/48">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function PresetButtons({ options, onPick }: { options: string[]; onPick: (value: string) => void }) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onPick(option)}
          className="rounded-full border border-[#0B2C6B]/12 bg-[#F8FAFC] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#0B2C6B]/70 transition hover:border-[#D9A441]/50 hover:bg-[#FFF8EA]"
        >
          {option}
        </button>
      ))}
    </div>
  );
}

export function Badge({ children, tone = "navy" }: { children: React.ReactNode; tone?: "navy" | "gold" }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
        tone === "gold"
          ? "bg-[#D9A441]/12 text-[#9B6C17]"
          : "bg-[#0B2C6B]/7 text-[#0B2C6B]/62"
      }`}
    >
      {children}
    </span>
  );
}

export function NotificationBadge({ count }: { count: number }) {
  return (
    <span className="min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white shadow-[0_8px_18px_-10px_rgba(220,38,38,0.9)]">
      {count > 99 ? "99+" : count}
    </span>
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
    <section className="rounded-[8px] border border-[#0B2C6B]/10 bg-white px-5 py-4 shadow-[0_18px_60px_-48px_rgba(11,44,107,0.28)] md:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#D9A441]">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-light tracking-[-0.04em] text-[#0B2C6B] md:text-3xl">{title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-black/58">{description}</p>
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
    default: "border-[#0B2C6B]/10 bg-[#F8FAFC] text-[#0B2C6B]",
    gold: "border-[#D9A441]/24 bg-[#FFF8EA] text-[#9B6C17]",
    danger: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className={`relative flex h-11 items-center gap-2 rounded-[12px] border px-3 ${toneClass}`}>
      <Icon size={16} />
      <span className="hidden text-[10px] font-bold uppercase tracking-[0.12em] opacity-65 sm:inline">{label}</span>
      {hasValue ? (
        <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full bg-[#D9A441] px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-[#071B3D] shadow-[0_8px_18px_-10px_rgba(217,164,65,0.9)]">
          {Number(value) > 99 ? "99+" : value}
        </span>
      ) : (
        <span className="text-xs font-bold opacity-45">0</span>
      )}
    </div>
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
    default: "bg-[#F8FAFC] text-[#0B2C6B]",
    gold: "bg-[#FFF8EA] text-[#9B6C17]",
    danger: "bg-red-50 text-red-700",
    success: "bg-emerald-50 text-emerald-700",
  }[tone];

  return (
    <div className="rounded-[8px] border border-black/[0.05] bg-white p-5 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.3)]">
      {Icon ? (
        <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[10px] ${toneClass}`}>
          <Icon size={19} />
        </div>
      ) : null}
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/38">{label}</p>
      <p className="mt-3 text-4xl font-light tracking-[-0.05em] text-[#0B2C6B]">{value}</p>
    </div>
  );
}

export function WorkflowStrip({ steps }: { steps: Array<{ title: string; description: string }> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {steps.map((step, index) => (
        <div key={step.title} className="rounded-[12px] border border-black/[0.05] bg-white p-4">
          <div className="mb-3 flex items-center gap-3">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-[#0B2C6B] text-xs font-bold text-white">{index + 1}</span>
            <p className="text-sm font-semibold text-[#0B2C6B]">{step.title}</p>
          </div>
          <p className="text-xs leading-relaxed text-black/52">{step.description}</p>
        </div>
      ))}
    </div>
  );
}

export function GuidancePanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="mb-5 rounded-[12px] border border-[#D9A441]/20 bg-[#FFF8EA] p-4">
      <p className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#9B6C17]">
        <ShieldCheck size={13} /> {title}
      </p>
      <div className="grid gap-2 md:grid-cols-3">
        {items.map((item) => (
          <p key={item} className="rounded-[10px] border border-[#D9A441]/10 bg-white/70 px-3 py-2 text-xs leading-relaxed text-black/58">
            {item}
          </p>
        ))}
      </div>
    </div>
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
    <div className="rounded-[12px] border border-dashed border-black/10 bg-[#FAFAF8] p-8 text-center">
      <ShieldCheck className="mx-auto mb-4 text-[#D9A441]" size={32} />
      <p className="text-sm font-semibold text-[#0B2C6B]">{title}</p>
      <p className="mx-auto mt-2 max-w-xl text-sm font-light leading-relaxed text-black/48">{description}</p>
      {action ? (
        <button
          type="button"
          onClick={action.onClick}
          className="mx-auto mt-5 flex h-11 items-center gap-2 rounded-[10px] bg-[#0B2C6B] px-4 text-xs font-bold uppercase tracking-[0.14em] text-white"
        >
          {action.label} <ArrowRight size={14} />
        </button>
      ) : null}
    </div>
  );
}

export function ConfirmDialog({ action, onClose }: { action: ConfirmAction; onClose: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const buttonClass =
    action.tone === "danger"
      ? "bg-red-600 text-white"
      : action.tone === "gold"
        ? "bg-[#D9A441] text-[#071B3D]"
        : "bg-[#0B2C6B] text-white";

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
    <div className="fixed inset-0 z-[60] grid place-items-center bg-[#071B3D]/58 px-4 py-6 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-[16px] bg-white p-6 shadow-[0_36px_90px_-38px_rgba(7,27,61,0.65)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">Review Aksi</p>
            <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">{action.title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-black/10 text-[#0B2C6B] disabled:opacity-50"
            aria-label="Tutup dialog konfirmasi"
          >
            <X size={16} />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-black/58">{action.description}</p>
        {action.details?.length ? (
          <div className="mt-4 rounded-[12px] border border-black/[0.06] bg-[#F8FAFC] p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-black/36">Yang akan diproses</p>
            <div className="space-y-2">
              {action.details.map((detail) => (
                <p key={detail} className="text-xs leading-relaxed text-[#0B2C6B]/70">{detail}</p>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-11 rounded-[10px] border border-black/10 px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#0B2C6B] disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className={`h-11 rounded-[10px] px-4 text-xs font-bold uppercase tracking-[0.12em] disabled:opacity-50 ${buttonClass}`}
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
    <div className="mb-5 rounded-[10px] border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
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
  return (
    <div className="fixed inset-0 z-[55] bg-[#071B3D]/55 px-4 py-6 backdrop-blur-sm">
      <div className={`mx-auto flex h-full w-full ${maxWidth} flex-col overflow-hidden rounded-[16px] bg-white shadow-[0_36px_90px_-38px_rgba(7,27,61,0.65)]`}>
        <div className="flex items-start justify-between gap-4 border-b border-black/[0.06] bg-[#FAFAF8] px-5 py-4">
          <div>
            {eyebrow && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D9A441]">{eyebrow}</p>}
            <h3 className="mt-1 text-xl font-semibold tracking-[-0.03em] text-[#0B2C6B]">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-black/10 bg-white text-[#0B2C6B]"
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
    <section className="rounded-[8px] border border-black/[0.05] bg-white p-5 shadow-[0_16px_50px_-44px_rgba(11,44,107,0.28)] md:p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold tracking-[-0.02em] text-[#0B2C6B]">{title}</h3>
        {action && <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-black/34">{action}</span>}
      </div>
      {children}
    </section>
  );
}

export function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-[#0B2C6B]/76">{label}</span>
        <span className="font-semibold text-[#0B2C6B]">{value}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#EDF1F6]">
        <div className="h-full rounded-full bg-[#0B2C6B]" style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="h-40 animate-pulse rounded-[8px] bg-white" />
      ))}
    </div>
  );
}

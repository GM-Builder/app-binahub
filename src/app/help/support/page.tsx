"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Send, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // In production, send to API
    await new Promise((r) => setTimeout(r, 800));
    setSent(true);
  };

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
        <div className="mx-auto max-w-lg pt-20 text-center">
          <CheckCircle2 size={48} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 text-2xl font-light">Pesan Terkirim</h1>
          <p className="mt-2 text-sm text-[#4A4C54]/70">Tim support kami akan merespon dalam 1×24 jam.</p>
          <Link href="/help" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
            <ArrowLeft size={12} /> Kembali ke Help Center
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-6 py-10 text-[#0B2C6B]">
      <div className="mx-auto max-w-lg">
        <Link href="/help" className="mb-6 inline-flex items-center gap-1 text-xs font-bold text-[#D9A441] hover:text-[#0B2C6B]">
          <ArrowLeft size={12} /> Kembali ke Help Center
        </Link>
        <div className="mb-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#D9A441]">Support</div>
        <h1 className="text-3xl font-light tracking-[-0.04em]">Hubungi Tim Support</h1>
        <p className="mt-2 text-sm text-[#4A4C54]/70">Isi form di bawah dan kami akan merespon secepatnya.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/60">Nama</span>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="h-11 w-full rounded-xl border border-[#0B2C6B]/10 bg-white px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/60">Email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="h-11 w-full rounded-xl border border-[#0B2C6B]/10 bg-white px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/60">Subjek</span>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} required
              className="h-11 w-full rounded-xl border border-[#0B2C6B]/10 bg-white px-4 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#4A4C54]/60">Pesan</span>
            <textarea rows={5} value={message} onChange={(e) => setMessage(e.target.value)} required
              className="w-full rounded-xl border border-[#0B2C6B]/10 bg-white px-4 py-3 text-sm text-[#0B2C6B] outline-none focus:border-[#D9A441]" />
          </label>
          <button type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0B2C6B] px-6 py-3 text-xs font-bold text-white hover:bg-[#0A255A]">
            <Send size={14} /> Kirim Pesan
          </button>
        </form>
      </div>
    </main>
  );
}

"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LoginRoleDialog() {
  return (
    <Link
      href="/"
      className="inline-flex items-center justify-center gap-2 rounded-[8px] bg-[#0B2C6B] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_18px_42px_-28px_rgba(11,44,107,0.72)] transition hover:bg-[#071A33]"
    >
      Masuk
      <ArrowRight size={16} />
    </Link>
  );
}

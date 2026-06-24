"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";

export function SearchInput({
  value,
  onChange,
  placeholder = "Cari...",
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`} role="search">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A4C54]/40" aria-hidden="true" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full rounded-lg border border-[#0B2C6B]/10 bg-white pl-9 pr-8 text-sm text-[#0B2C6B] outline-none placeholder:text-[#4A4C54]/40 focus:border-[#D9A441]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Hapus pencarian"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-[#4A4C54]/40 hover:text-[#0B2C6B]"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

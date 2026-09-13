"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/events${q ? `?q=${encodeURIComponent(q)}` : ""}`);
      }}
      className="flex gap-2 bg-white rounded-xl p-2 shadow-xl"
    >
      <div className="flex-1 min-w-0 flex items-center gap-2 px-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gray-400 shrink-0">
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search events, artists or venues"
          className="w-full py-2 text-gray-900 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-brand-gradient bg-[length:200%_auto] text-white px-6 py-2 font-semibold hover:bg-right transition-[background-position] duration-500"
      >
        Search
      </button>
    </form>
  );
}

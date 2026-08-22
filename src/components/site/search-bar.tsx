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
      className="flex gap-2 bg-white rounded-xl p-2 shadow-lg"
    >
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search events, cities, or venues..."
        className="flex-1 min-w-0 px-3 py-2 text-gray-900 rounded-lg focus:outline-none"
      />
      <button type="submit" className="rounded-lg bg-brand text-white px-5 py-2 font-semibold hover:bg-brand-dark">
        Search
      </button>
    </form>
  );
}

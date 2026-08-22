"use client";

import { useState, useTransition } from "react";
import { subscribeNewsletter } from "@/app/actions/public";

export default function NewsletterForm() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await subscribeNewsletter(formData);
          setStatus(result);
        });
      }}
      className="flex gap-2"
    >
      <input
        type="email"
        name="email"
        required
        placeholder="you@email.com"
        className="min-w-0 flex-1 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand"
      />
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
      >
        {pending ? "..." : "Subscribe"}
      </button>
      {status && (
        <p className={`absolute mt-12 text-xs ${status.ok ? "text-green-400" : "text-red-400"}`}>{status.message}</p>
      )}
    </form>
  );
}

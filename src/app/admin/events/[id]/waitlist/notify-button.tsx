"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { notifyWaitlistEntryAction } from "@/app/actions/waitlist";

export default function NotifyButton({ entryId, status }: { entryId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  if (status !== "WAITING") return <span className="text-xs text-gray-400">Notified</span>;
  return (
    <button
      className="text-xs font-semibold text-brand disabled:opacity-50"
      disabled={pending}
      onClick={() => startTransition(async () => { await notifyWaitlistEntryAction(entryId); router.refresh(); })}
    >
      {pending ? "Sending..." : "Notify"}
    </button>
  );
}

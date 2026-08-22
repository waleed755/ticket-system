"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateContactMessageStatusAction } from "@/app/actions/admin-communications";

export default function StatusSelect({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <select
      value={status}
      disabled={pending}
      onChange={(e) =>
        startTransition(async () => {
          await updateContactMessageStatusAction(id, e.target.value as "NEW" | "IN_PROGRESS" | "RESOLVED");
          router.refresh();
        })
      }
      className="text-xs rounded-lg border border-gray-300 px-2 py-1"
    >
      <option value="NEW">New</option>
      <option value="IN_PROGRESS">In progress</option>
      <option value="RESOLVED">Resolved</option>
    </select>
  );
}

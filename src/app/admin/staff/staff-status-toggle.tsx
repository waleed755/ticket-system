"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateStaffStatusAction } from "@/app/actions/admin-staff";

export default function StaffStatusToggle({ userId, status }: { userId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="text-xs font-semibold text-brand disabled:opacity-50"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateStaffStatusAction(userId, status === "ACTIVE" ? "INACTIVE" : "ACTIVE");
          router.refresh();
        })
      }
    >
      {status === "ACTIVE" ? "Deactivate" : "Activate"}
    </button>
  );
}

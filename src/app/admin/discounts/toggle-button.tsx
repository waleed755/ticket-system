"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleDiscountActiveAction } from "@/app/actions/admin-discounts";

export default function ToggleButton({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      className="text-xs font-semibold text-brand disabled:opacity-50"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleDiscountActiveAction(id, !active);
          router.refresh();
        })
      }
    >
      {active ? "Deactivate" : "Activate"}
    </button>
  );
}

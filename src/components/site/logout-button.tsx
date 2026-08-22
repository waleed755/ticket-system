"use client";

import { useRouter } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await logoutAction();
        router.push("/login");
        router.refresh();
      }}
      className={className ?? "text-sm font-medium text-gray-500 hover:text-gray-900"}
    >
      Sign out
    </button>
  );
}

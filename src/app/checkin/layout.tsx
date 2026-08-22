import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import LogoutButton from "@/components/site/logout-button";

export default async function CheckinLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !["CHECKIN_STAFF", "ADMIN", "BOOKING_MANAGER"].includes(session.role)) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="h-14 flex items-center justify-between px-4 border-b border-gray-800">
        <div className="flex items-center gap-2 font-bold">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand text-white text-xs">G</span>
          Check-in
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-400">{session.fullName}</span>
          <LogoutButton className="text-sm font-medium text-gray-400 hover:text-white" />
        </div>
      </header>
      <main className="max-w-lg mx-auto p-4">{children}</main>
    </div>
  );
}

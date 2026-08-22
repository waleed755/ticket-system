import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CheckinEventSelectPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const events =
    session.role === "ADMIN" || session.role === "BOOKING_MANAGER"
      ? await prisma.event.findMany({ where: { status: { in: ["PUBLISHED", "PAUSED"] } }, orderBy: { startAt: "asc" } })
      : await prisma.event.findMany({
          where: { assignments: { some: { userId: session.userId } }, status: { in: ["PUBLISHED", "PAUSED"] } },
          orderBy: { startAt: "asc" },
        });

  return (
    <div>
      <h1 className="text-xl font-bold mb-1">Select an event</h1>
      <p className="text-sm text-gray-400 mb-6">Choose the event you&apos;re checking guests in for.</p>
      {events.length === 0 ? (
        <p className="text-gray-400 text-sm">No events assigned to you.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => (
            <Link key={e.id} href={`/checkin/${e.id}`} className="block bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-brand">
              <p className="font-semibold">{e.name}</p>
              <p className="text-sm text-gray-400">{e.startAt.toLocaleDateString()} · {e.venueName ?? "Online"}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

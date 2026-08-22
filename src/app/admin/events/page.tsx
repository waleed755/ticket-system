import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScopedEventIds } from "@/lib/admin-scope";
import { getPermissions } from "@/lib/permissions";
import { Card, Badge, SectionHeading, LinkButton, EmptyState } from "@/components/ui";
import { formatEventDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

const statusColor: Record<string, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  DRAFT: "gray",
  PUBLISHED: "green",
  PAUSED: "amber",
  POSTPONED: "amber",
  RESCHEDULED: "purple",
  CANCELLED: "red",
  COMPLETED: "blue",
  ARCHIVED: "gray",
};

export default async function AdminEventsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const session = await getSession();
  const perms = getPermissions(session!.role);
  const scoped = await getScopedEventIds(session!);

  const events = await prisma.event.findMany({
    where: {
      ...(scoped === "ALL" ? {} : { id: { in: scoped } }),
      ...(status ? { status: status as never } : {}),
    },
    include: { category: true, ticketCategories: true, _count: { select: { bookings: true, tickets: true } } },
    orderBy: { createdAt: "desc" },
  });

  const statuses = ["DRAFT", "PUBLISHED", "PAUSED", "RESCHEDULED", "CANCELLED", "COMPLETED", "ARCHIVED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading title="Events" description={`${events.length} event(s)`} />
        {perms.events === "full" && <LinkButton href="/admin/events/new">Create Event</LinkButton>}
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/admin/events" className={`px-3 py-1 rounded-full text-xs font-semibold ${!status ? "bg-brand text-white" : "bg-white border border-gray-200"}`}>All</Link>
        {statuses.map((s) => (
          <Link key={s} href={`/admin/events?status=${s}`} className={`px-3 py-1 rounded-full text-xs font-semibold ${status === s ? "bg-brand text-white" : "bg-white border border-gray-200"}`}>
            {s}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <Card className="p-0"><EmptyState title="No events found" /></Card>
      ) : (
        <div className="grid gap-4">
          {events.map((e) => {
            const sold = e.ticketCategories.reduce((s, c) => s + c.quantitySold, 0);
            const total = e.ticketCategories.reduce((s, c) => s + c.totalQuantity, 0);
            return (
              <Link key={e.id} href={`/admin/events/${e.id}/edit`}>
                <Card className="p-5 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-gray-900">{e.name}</p>
                      <Badge color={statusColor[e.status]}>{e.status}</Badge>
                      {e.visibility === "PRIVATE" && <Badge color="purple">Private</Badge>}
                    </div>
                    <p className="text-sm text-gray-500">{formatEventDateTime(e.startAt, e.timezone)} · {e.category.name}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <p>{e._count.bookings} booking(s)</p>
                    <p>{sold}/{total} tickets sold</p>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

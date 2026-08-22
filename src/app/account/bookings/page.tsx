import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState, SectionHeading, LinkButton } from "@/components/ui";
import { formatEventDateTime } from "@/lib/format";
import { bookingStatusColor, formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

export default async function BookingsListPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const { filter = "all" } = await searchParams;
  const session = await getSession();
  const bookings = await prisma.booking.findMany({
    where: { customerId: session!.userId },
    include: { event: true, tickets: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const filtered = bookings.filter((b) => {
    if (filter === "upcoming") return b.event.startAt > now && !["CANCELLED", "FULLY_REFUNDED", "EXPIRED"].includes(b.status);
    if (filter === "previous") return b.event.endAt <= now;
    if (filter === "cancelled") return ["CANCELLED", "FULLY_REFUNDED", "EXPIRED"].includes(b.status);
    return true;
  });

  const tabs = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "previous", label: "Previous" },
    { key: "cancelled", label: "Cancelled / Refunded" },
  ];

  return (
    <div>
      <SectionHeading title="My bookings" />
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/account/bookings?filter=${t.key}`}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${filter === t.key ? "bg-brand text-white" : "bg-white border border-gray-200 text-gray-600"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="p-0"><EmptyState title="No bookings here" action={<LinkButton href="/events">Browse events</LinkButton>} /></Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link key={b.id} href={`/account/bookings/${b.id}`}>
              <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="text-xs text-gray-400">{b.bookingNumber}</p>
                  <p className="font-semibold text-gray-900">{b.event.name}</p>
                  <p className="text-sm text-gray-500">{formatEventDateTime(b.event.startAt, b.event.timezone)}</p>
                </div>
                <div className="text-right">
                  <Badge color={bookingStatusColor[b.status]}>{formatStatusLabel(b.status)}</Badge>
                  <p className="text-sm text-gray-500 mt-1">{b.tickets.length} ticket(s)</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

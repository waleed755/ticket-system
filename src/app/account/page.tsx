import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, EmptyState, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";
import { bookingStatusColor, formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

export default async function AccountOverviewPage() {
  const session = await getSession();
  const bookings = await prisma.booking.findMany({
    where: { customerId: session!.userId, status: { not: "EXPIRED" } },
    include: { event: true, tickets: true },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.event.startAt > now && b.status !== "CANCELLED" && b.status !== "FULLY_REFUNDED");
  const totalSpent = bookings.reduce((s, b) => s + b.totalAmount, 0);
  const totalTickets = bookings.reduce((s, b) => s + b.tickets.length, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {session!.fullName.split(" ")[0]}</h1>
        <p className="text-sm text-gray-500">Here&apos;s what&apos;s happening with your bookings.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm text-gray-500">Upcoming events</p>
          <p className="text-2xl font-bold text-gray-900">{upcoming.length}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total tickets booked</p>
          <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-gray-500">Total spent</p>
          <p className="text-2xl font-bold text-gray-900">{formatMoney(totalSpent)}</p>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Upcoming events</h2>
          <Link href="/account/bookings" className="text-sm text-brand font-semibold">View all bookings →</Link>
        </div>
        {upcoming.length === 0 ? (
          <Card className="p-0"><EmptyState title="No upcoming events" description="Browse events to book your next one." action={<LinkButton href="/events">Browse events</LinkButton>} /></Card>
        ) : (
          <div className="space-y-3">
            {upcoming.slice(0, 5).map((b) => (
              <Link key={b.id} href={`/account/bookings/${b.id}`}>
                <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
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
    </div>
  );
}

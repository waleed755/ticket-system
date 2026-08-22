import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScopedEventIds } from "@/lib/admin-scope";
import { Card, Badge, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";
import { bookingStatusColor, formatStatusLabel } from "@/lib/booking-status";
import Link from "next/link";
import RunJobsButton from "@/components/admin/run-jobs-button";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getSession();
  const scoped = await getScopedEventIds(session!);
  const eventFilter = scoped === "ALL" ? {} : { id: { in: scoped } };
  const bookingEventFilter = scoped === "ALL" ? {} : { eventId: { in: scoped } };

  const [
    totalEvents,
    publishedEvents,
    draftEvents,
    cancelledEvents,
    totalBookings,
    confirmedBookings,
    pendingPayments,
    ticketsSold,
    checkedIn,
    revenueAgg,
    refundedAgg,
    pendingRefunds,
    recentBookings,
    recentCheckIns,
  ] = await Promise.all([
    prisma.event.count({ where: eventFilter }),
    prisma.event.count({ where: { ...eventFilter, status: "PUBLISHED" } }),
    prisma.event.count({ where: { ...eventFilter, status: "DRAFT" } }),
    prisma.event.count({ where: { ...eventFilter, status: "CANCELLED" } }),
    prisma.booking.count({ where: bookingEventFilter }),
    prisma.booking.count({ where: { ...bookingEventFilter, status: "CONFIRMED" } }),
    prisma.booking.count({ where: { ...bookingEventFilter, status: "PENDING_PAYMENT" } }),
    prisma.ticket.count({ where: { event: eventFilter, status: { in: ["VALID", "CHECKED_IN"] } } }),
    prisma.ticket.count({ where: { event: eventFilter, status: "CHECKED_IN" } }),
    prisma.payment.aggregate({ where: { status: "SUCCEEDED", booking: bookingEventFilter }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { status: { in: ["COMPLETED", "PARTIALLY_APPROVED"] }, booking: bookingEventFilter }, _sum: { approvedAmount: true } }),
    prisma.refund.count({ where: { status: "PENDING", booking: bookingEventFilter } }),
    prisma.booking.findMany({ where: bookingEventFilter, include: { event: true }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.ticket.findMany({ where: { event: eventFilter, status: "CHECKED_IN" }, include: { attendee: true, event: true }, orderBy: { checkedInAt: "desc" }, take: 5 }),
  ]);

  const stats = [
    { label: "Total events", value: totalEvents },
    { label: "Published", value: publishedEvents },
    { label: "Draft", value: draftEvents },
    { label: "Cancelled", value: cancelledEvents },
    { label: "Total bookings", value: totalBookings },
    { label: "Confirmed bookings", value: confirmedBookings },
    { label: "Pending payments", value: pendingPayments },
    { label: "Tickets sold", value: ticketsSold },
    { label: "Checked in", value: checkedIn },
    { label: "Total revenue", value: formatMoney(revenueAgg._sum.amount ?? 0) },
    { label: "Total refunded", value: formatMoney(refundedAgg._sum.approvedAmount ?? 0) },
    { label: "Pending refund requests", value: pendingRefunds },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionHeading title="Dashboard" description="An overview of events, bookings, and revenue." />
        {session!.role === "ADMIN" && <RunJobsButton />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent bookings</h2>
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="flex items-center justify-between text-sm hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{b.event.name}</p>
                  <p className="text-gray-400 text-xs">{b.bookingNumber} · {b.buyerName}</p>
                </div>
                <Badge color={bookingStatusColor[b.status]}>{formatStatusLabel(b.status)}</Badge>
              </Link>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Recent check-ins</h2>
          {recentCheckIns.length === 0 ? (
            <p className="text-sm text-gray-400">No check-ins yet.</p>
          ) : (
            <div className="space-y-3">
              {recentCheckIns.map((t) => (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{t.attendee.fullName}</p>
                    <p className="text-gray-400 text-xs">{t.event.name}</p>
                  </div>
                  <p className="text-gray-500 text-xs">{t.checkedInAt ? formatEventDateTime(t.checkedInAt, t.event.timezone) : ""}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

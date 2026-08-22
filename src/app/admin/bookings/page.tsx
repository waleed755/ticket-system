import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScopedEventIds } from "@/lib/admin-scope";
import { Card, Badge, SectionHeading, Input, Select, EmptyState, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { bookingStatusColor, formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; eventId?: string }>;
}) {
  const { q, status, eventId } = await searchParams;
  const session = await getSession();
  const scoped = await getScopedEventIds(session!);

  const events = await prisma.event.findMany({ where: scoped === "ALL" ? {} : { id: { in: scoped } }, select: { id: true, name: true } });

  const bookings = await prisma.booking.findMany({
    where: {
      ...(scoped === "ALL" ? {} : { eventId: { in: scoped } }),
      ...(eventId ? { eventId } : {}),
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { bookingNumber: { contains: q, mode: "insensitive" } },
              { buyerName: { contains: q, mode: "insensitive" } },
              { buyerEmail: { contains: q, mode: "insensitive" } },
              { buyerPhone: { contains: q, mode: "insensitive" } },
              { attendees: { some: { fullName: { contains: q, mode: "insensitive" } } } },
              { tickets: { some: { ticketNumber: { contains: q, mode: "insensitive" } } } },
            ],
          }
        : {}),
    },
    include: { event: true, tickets: true, payments: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const statuses = ["PENDING_PAYMENT", "CONFIRMED", "PARTIALLY_REFUNDED", "FULLY_REFUNDED", "CANCELLED", "EXPIRED", "COMPLETED"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading title="Bookings" description={`${bookings.length} shown`} />
        <div className="flex gap-2">
          <a href="/api/bookings/export" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">Export CSV</a>
          <LinkButton href="/admin/bookings/manual">+ Manual booking</LinkButton>
        </div>
      </div>

      <form className="grid sm:grid-cols-4 gap-3 mb-6">
        <Input name="q" defaultValue={q} placeholder="Search name, email, phone, booking/ticket #..." className="sm:col-span-2" />
        <Select name="status" defaultValue={status ?? ""}>
          <option value="">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{formatStatusLabel(s)}</option>)}
        </Select>
        <Select name="eventId" defaultValue={eventId ?? ""}>
          <option value="">All events</option>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
        <button className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold sm:col-span-4 sm:w-40">Filter</button>
      </form>

      {bookings.length === 0 ? (
        <Card className="p-0"><EmptyState title="No bookings found" /></Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2">Booking #</th>
                <th className="px-4 py-2">Event</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Tickets</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <Link href={`/admin/bookings/${b.id}`} className="font-mono text-xs text-brand font-semibold">{b.bookingNumber}</Link>
                  </td>
                  <td className="px-4 py-2">{b.event.name}</td>
                  <td className="px-4 py-2">{b.buyerName}<br /><span className="text-xs text-gray-400">{b.buyerEmail}</span></td>
                  <td className="px-4 py-2">{b.tickets.length}</td>
                  <td className="px-4 py-2">{formatMoney(b.totalAmount, b.currency)}</td>
                  <td className="px-4 py-2"><Badge color={bookingStatusColor[b.status]}>{formatStatusLabel(b.status)}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

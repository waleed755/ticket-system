import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, Input, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { ticketStatusColor, formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

export default async function GuestListPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ q?: string; status?: string }> }) {
  const { id } = await params;
  const { q, status } = await searchParams;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const tickets = await prisma.ticket.findMany({
    where: {
      eventId: id,
      ...(status ? { status: status as never } : {}),
      ...(q
        ? {
            OR: [
              { attendee: { fullName: { contains: q } } },
              { ticketNumber: { contains: q } },
              { booking: { bookingNumber: { contains: q } } },
              { booking: { buyerName: { contains: q } } },
              { booking: { buyerEmail: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { attendee: true, booking: true, ticketCategory: true, checkedInBy: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <SectionHeading title={`Guest list — ${event.name}`} description={`${tickets.length} ticket(s)`} />

      <form className="flex gap-2 mb-6">
        <Input name="q" defaultValue={q} placeholder="Search by name, email, ticket #, booking #..." />
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {["VALID", "CHECKED_IN", "CANCELLED", "REFUNDED", "EXPIRED"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold">Filter</button>
        <a href={`/api/events/${id}/guests/export`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">
          Export CSV
        </a>
      </form>

      {tickets.length === 0 ? (
        <Card className="p-0"><EmptyState title="No guests match" /></Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-2">Attendee</th>
                <th className="px-4 py-2">Buyer</th>
                <th className="px-4 py-2">Category</th>
                <th className="px-4 py-2">Ticket #</th>
                <th className="px-4 py-2">Booking #</th>
                <th className="px-4 py-2">Price</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Check-in</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-2 font-medium text-gray-900">{t.attendee.fullName}</td>
                  <td className="px-4 py-2 text-gray-500">{t.booking.buyerName}<br /><span className="text-xs">{t.booking.buyerEmail}</span></td>
                  <td className="px-4 py-2">{t.ticketCategory.name}</td>
                  <td className="px-4 py-2 font-mono text-xs">{t.ticketNumber}</td>
                  <td className="px-4 py-2 font-mono text-xs">{t.booking.bookingNumber}</td>
                  <td className="px-4 py-2">{formatMoney(t.price)}</td>
                  <td className="px-4 py-2"><Badge color={ticketStatusColor[t.status]}>{formatStatusLabel(t.status)}</Badge></td>
                  <td className="px-4 py-2 text-xs text-gray-500">{t.checkedInAt ? `${t.checkedInAt.toLocaleString()} · ${t.checkedInBy?.fullName ?? ""}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";
import { bookingStatusColor, ticketStatusColor, refundStatusColor, formatStatusLabel } from "@/lib/booking-status";
import { NoteForm, ResendButton, CancelBookingForm, InvalidateTicketButton } from "./booking-admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: true,
      attendees: { include: { ticket: true, ticketCategory: true } },
      payments: true,
      refunds: { include: { ticketLinks: { include: { ticket: { include: { attendee: true } } } } } },
      notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!booking) notFound();

  const activity = await prisma.activityLog.findMany({ where: { entityType: "BOOKING", entityId: id }, orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">{booking.bookingNumber}</p>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{booking.event.name}</h1>
            <Badge color={bookingStatusColor[booking.status]}>{formatStatusLabel(booking.status)}</Badge>
            {booking.isManual && <Badge color="purple">Manual</Badge>}
          </div>
          <p className="text-sm text-gray-500">{formatEventDateTime(booking.event.startAt, booking.event.timezone)}</p>
        </div>
        <div className="flex gap-2">
          <ResendButton bookingId={booking.id} />
          {booking.status !== "CANCELLED" && <CancelBookingForm bookingId={booking.id} />}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Buyer</h2>
            <div className="grid sm:grid-cols-3 gap-3 text-sm">
              <div><p className="text-gray-500">Name</p><p className="font-medium">{booking.buyerName}</p></div>
              <div><p className="text-gray-500">Email</p><p className="font-medium">{booking.buyerEmail}</p></div>
              <div><p className="text-gray-500">Phone</p><p className="font-medium">{booking.buyerPhone}</p></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Attendees & tickets</h2>
            <div className="space-y-3">
              {booking.attendees.map((a) => (
                <div key={a.id} className="border border-gray-200 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{a.fullName} <span className="text-gray-400">({a.ticketCategory.name})</span></p>
                    {a.ticket && <p className="text-xs text-gray-400 font-mono">{a.ticket.ticketNumber}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    {a.ticket && <Badge color={ticketStatusColor[a.ticket.status]}>{formatStatusLabel(a.ticket.status)}</Badge>}
                    {a.ticket && a.ticket.status === "VALID" && <InvalidateTicketButton ticketId={a.ticket.id} bookingId={booking.id} />}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Payments</h2>
            <div className="space-y-2 text-sm mb-3">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(booking.subtotal, booking.currency)}</span></div>
              {booking.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatMoney(booking.discountAmount, booking.currency)}</span></div>}
              <div className="flex justify-between font-bold border-t border-gray-100 pt-2"><span>Total</span><span>{formatMoney(booking.totalAmount, booking.currency)}</span></div>
            </div>
            {booking.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
                <span>{p.reference} · {p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4}` : p.method}{p.failureReason ? ` — ${p.failureReason}` : ""}</span>
                <Badge color={p.status === "SUCCEEDED" ? "green" : p.status === "FAILED" ? "red" : "amber"}>{formatStatusLabel(p.status)}</Badge>
              </div>
            ))}
          </Card>

          {booking.refunds.length > 0 && (
            <Card className="p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Refunds</h2>
              <div className="space-y-2">
                {booking.refunds.map((r) => (
                  <div key={r.id} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2">
                    <span>{r.ticketLinks.map((l) => l.ticket.attendee.fullName).join(", ")} — {formatMoney(r.requestedAmount, booking.currency)}</span>
                    <Badge color={refundStatusColor[r.status]}>{formatStatusLabel(r.status)}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Internal notes</h2>
            <NoteForm bookingId={booking.id} />
            <div className="mt-4 space-y-3">
              {booking.notes.map((n) => (
                <div key={n.id} className="text-sm border-t border-gray-100 pt-2">
                  <p className="text-gray-700">{n.note}</p>
                  <p className="text-xs text-gray-400">{n.author?.fullName ?? "System"} · {n.createdAt.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Activity</h2>
            <div className="space-y-3">
              {activity.map((a) => (
                <div key={a.id} className="text-xs border-t border-gray-100 pt-2">
                  <p className="text-gray-700">{a.description}</p>
                  <p className="text-gray-400">{a.actorName} · {a.createdAt.toLocaleString()}</p>
                </div>
              ))}
              {activity.length === 0 && <p className="text-xs text-gray-400">No activity recorded.</p>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

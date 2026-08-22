import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, Alert } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";
import { bookingStatusColor, ticketStatusColor, refundStatusColor, formatStatusLabel } from "@/lib/booking-status";
import { getTicketEligibility } from "@/lib/refunds";
import { formatDeadline } from "@/lib/refund-policy";
import RefundRequestForm from "./refund-request-form";
import AttendeeEditor from "./attendee-editor";
import ResendButton from "./resend-button";

export const dynamic = "force-dynamic";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect("/login");

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      event: true,
      attendees: { include: { ticket: true, ticketCategory: true } },
      payments: true,
      refunds: { include: { ticketLinks: { include: { ticket: { include: { attendee: true } } } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!booking) notFound();
  if (booking.customerId !== session.userId) redirect("/account/bookings");

  const eligibilities = await Promise.all(
    booking.attendees.filter((a) => a.ticket).map(async (a) => ({ attendee: a, eligibility: await getTicketEligibility(a.ticket!.id) }))
  );
  const refundableTickets = eligibilities
    .filter((e) => e.eligibility.eligible)
    .map((e) => ({ id: e.attendee.ticket!.id, attendeeName: e.attendee.fullName, categoryName: e.attendee.ticketCategory.name, price: e.attendee.ticket!.price }));

  const successfulPayment = booking.payments.find((p) => p.succeededAt !== null);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400">{booking.bookingNumber}</p>
        <div className="flex items-center gap-3 mt-1">
          <h1 className="text-2xl font-bold text-gray-900">{booking.event.name}</h1>
          <Badge color={bookingStatusColor[booking.status]}>{formatStatusLabel(booking.status)}</Badge>
        </div>
        <p className="text-sm text-gray-500">{formatEventDateTime(booking.event.startAt, booking.event.timezone)}</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <a href={`/api/bookings/${booking.id}/tickets`} className="rounded-lg bg-brand text-white text-sm font-semibold px-4 py-2 hover:bg-brand-dark">Download all tickets (PDF)</a>
        {successfulPayment && (
          <a href={`/api/bookings/${booking.id}/receipt`} className="rounded-lg border border-gray-300 text-sm font-semibold px-4 py-2 hover:bg-gray-50">Download receipt</a>
        )}
        <ResendButton bookingId={booking.id} />
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Buyer information</h2>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <div><p className="text-gray-500">Name</p><p className="font-medium">{booking.buyerName}</p></div>
          <div><p className="text-gray-500">Email</p><p className="font-medium">{booking.buyerEmail}</p></div>
          <div><p className="text-gray-500">Phone</p><p className="font-medium">{booking.buyerPhone}</p></div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Attendees & tickets</h2>
        <div className="space-y-4">
          {booking.attendees.map((a) => (
            <div key={a.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{a.fullName} <span className="text-gray-400 font-normal">({a.ticketCategory.name})</span></p>
                  {a.ticket && <p className="text-xs text-gray-400">Ticket #{a.ticket.ticketNumber}</p>}
                </div>
                <div className="flex items-center gap-2">
                  {a.ticket && <Badge color={ticketStatusColor[a.ticket.status]}>{formatStatusLabel(a.ticket.status)}</Badge>}
                  {a.ticket && (
                    <a href={`/api/tickets/${a.ticket.id}/download`} className="text-xs text-brand font-semibold">
                      Download
                    </a>
                  )}
                </div>
              </div>
              <AttendeeEditor
                bookingId={booking.id}
                attendeeId={a.id}
                initial={{
                  email: a.email ?? "",
                  phone: a.phone ?? "",
                  dietaryNeeds: a.dietaryNeeds ?? "",
                  accessibilityNeeds: a.accessibilityNeeds ?? "",
                  emergencyContact: a.emergencyContact ?? "",
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Payment</h2>
        <div className="space-y-2 text-sm mb-3">
          <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(booking.subtotal, booking.currency)}</span></div>
          {booking.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatMoney(booking.discountAmount, booking.currency)}</span></div>}
          {booking.feeAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Service fee</span><span>{formatMoney(booking.feeAmount, booking.currency)}</span></div>}
          <div className="flex justify-between font-bold border-t border-gray-100 pt-2"><span>Total</span><span>{formatMoney(booking.totalAmount, booking.currency)}</span></div>
        </div>
        {booking.payments.map((p) => (
          <div key={p.id} className="flex justify-between text-xs text-gray-500 border-t border-gray-100 pt-2">
            <span>{p.reference} · {p.cardBrand ? `${p.cardBrand} •••• ${p.cardLast4}` : "Free order"}</span>
            <Badge color={p.status === "SUCCEEDED" ? "green" : p.status === "FAILED" ? "red" : "amber"}>{formatStatusLabel(p.status)}</Badge>
          </div>
        ))}
      </Card>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Refund eligibility</h2>
        <div className="space-y-2 mb-4">
          {eligibilities.map(({ attendee, eligibility }) => (
            <div key={attendee.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
              <span>{attendee.fullName} ({attendee.ticketCategory.name})</span>
              {eligibility.eligible ? (
                <Badge color="green">Eligible until {formatDeadline(eligibility.deadline, booking.event.timezone)}</Badge>
              ) : (
                <Badge color="gray">Not eligible</Badge>
              )}
            </div>
          ))}
          {eligibilities.some((e) => !e.eligibility.eligible) && (
            <Alert variant="info">
              {eligibilities.find((e) => !e.eligibility.eligible)?.eligibility.reasonMessage}
            </Alert>
          )}
        </div>
        {successfulPayment && <RefundRequestForm bookingId={booking.id} tickets={refundableTickets} />}
      </Card>

      {booking.refunds.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-3">Refund history</h2>
          <div className="space-y-3">
            {booking.refunds.map((r) => (
              <div key={r.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{r.ticketLinks.map((l) => l.ticket.attendee.fullName).join(", ")}</span>
                  <Badge color={refundStatusColor[r.status]}>{formatStatusLabel(r.status)}</Badge>
                </div>
                <p className="text-gray-500">Requested {formatMoney(r.requestedAmount, booking.currency)} — {r.reason}</p>
                {r.approvedAmount !== null && <p className="text-gray-500">Approved amount: {formatMoney(r.approvedAmount, booking.currency)}</p>}
                {r.customerMessage && <p className="text-gray-600 mt-1 italic">&ldquo;{r.customerMessage}&rdquo;</p>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

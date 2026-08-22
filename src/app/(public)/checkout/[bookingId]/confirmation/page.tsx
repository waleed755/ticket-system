import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Container, Card, Badge, LinkButton, Alert } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      event: true,
      attendees: { include: { ticket: true, ticketCategory: true } },
      customer: true,
    },
  });

  if (!booking) notFound();
  if (booking.status === "PENDING_PAYMENT") redirect(`/checkout/${booking.id}/pay`);

  const isNewAccount = booking.customer?.status === "PENDING_ACTIVATION";

  return (
    <Container className="py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="mx-auto h-14 w-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl mb-4">✓</div>
        <h1 className="text-2xl font-bold text-gray-900">Booking confirmed!</h1>
        <p className="text-gray-500 mt-1">A confirmation email with your tickets has been sent to {booking.buyerEmail}.</p>
      </div>

      <Card className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Booking number</p>
            <p className="font-bold text-gray-900">{booking.bookingNumber}</p>
          </div>
          <Badge color="green">{booking.status.replace("_", " ")}</Badge>
        </div>
        <p className="font-semibold text-gray-900">{booking.event.name}</p>
        <p className="text-sm text-gray-500">{formatEventDateTime(booking.event.startAt, booking.event.timezone)}</p>

        <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
          {booking.attendees.map((a) => (
            <div key={a.id} className="flex justify-between text-sm">
              <span>{a.fullName} <span className="text-gray-400">({a.ticketCategory.name})</span></span>
              <span className="text-gray-500">Ticket #{a.ticket?.ticketNumber}</span>
            </div>
          ))}
        </div>

        <div className="mt-4 border-t border-gray-100 pt-4 flex justify-between font-bold">
          <span>Total paid</span>
          <span>{booking.totalAmount === 0 ? "Free" : formatMoney(booking.totalAmount, booking.currency)}</span>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3 mb-6">
        <a href={`/api/bookings/${booking.id}/tickets`} className="text-center rounded-lg bg-brand text-white font-semibold py-3 hover:bg-brand-dark">
          Download all tickets (PDF)
        </a>
        {booking.totalAmount > 0 && (
          <a href={`/api/bookings/${booking.id}/receipt`} className="text-center rounded-lg border border-gray-300 font-semibold py-3 hover:bg-gray-50">
            Download receipt
          </a>
        )}
      </div>

      {isNewAccount && (
        <Alert variant="info">
          We&apos;ve created an account for you using {booking.buyerEmail}. Check your inbox for an activation link so you can access this booking,
          download tickets, and track refunds any time — activation is optional and your booking is already confirmed.
        </Alert>
      )}

      <div className="mt-6 flex justify-center gap-3">
        <LinkButton href="/events" variant="secondary">Browse more events</LinkButton>
        <LinkButton href="/account" variant="primary">Go to my account</LinkButton>
      </div>
    </Container>
  );
}

import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Container, Card, Alert, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import PaymentForm from "@/components/booking/payment-form";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, attendees: true },
  });

  if (!booking) notFound();

  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    redirect(`/checkout/${booking.id}/confirmation`);
  }

  if (booking.status === "EXPIRED" || booking.status === "CANCELLED") {
    return (
      <Container className="py-16 max-w-lg">
        <Alert variant="error">
          {booking.status === "EXPIRED"
            ? "Your reserved tickets have expired because payment wasn't completed in time."
            : "This booking has been cancelled."}
        </Alert>
        <div className="mt-4">
          <LinkButton href={`/events/${booking.event.slug}`} variant="secondary">Back to event</LinkButton>
        </div>
      </Container>
    );
  }

  const isExpired = booking.reservationExpiresAt && booking.reservationExpiresAt < new Date();
  if (isExpired) {
    return (
      <Container className="py-16 max-w-lg">
        <Alert variant="error">Your reserved tickets expired before payment was completed. Please start a new booking.</Alert>
        <div className="mt-4">
          <LinkButton href={`/events/${booking.event.slug}`} variant="secondary">Back to event</LinkButton>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Complete your payment</h1>
      <p className="text-sm text-gray-500 mb-6">
        Booking {booking.bookingNumber} for {booking.event.name} · {booking.attendees.length} ticket(s)
      </p>

      <Card className="p-6 mb-6">
        <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Subtotal</span><span>{formatMoney(booking.subtotal, booking.currency)}</span></div>
        {booking.discountAmount > 0 && <div className="flex justify-between text-sm mb-2 text-green-700"><span>Discount</span><span>−{formatMoney(booking.discountAmount, booking.currency)}</span></div>}
        {booking.feeAmount > 0 && <div className="flex justify-between text-sm mb-2"><span className="text-gray-500">Service fee</span><span>{formatMoney(booking.feeAmount, booking.currency)}</span></div>}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"><span>Total due</span><span>{booking.totalAmount === 0 ? "Free" : formatMoney(booking.totalAmount, booking.currency)}</span></div>
      </Card>

      <PaymentForm bookingId={booking.id} totalAmount={booking.totalAmount} reservationExpiresAt={booking.reservationExpiresAt?.toISOString() ?? null} />
    </Container>
  );
}

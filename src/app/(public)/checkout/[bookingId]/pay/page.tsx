import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Container, Card, Alert, Badge, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import CheckoutSteps from "@/components/booking/checkout-steps";
import PaymentDetailsForm from "@/components/booking/payment-details-form";
import FreeBookingConfirm from "@/components/booking/free-booking-confirm";

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: true, attendees: { include: { ticketCategory: true } } },
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

  // Order summary grouped by ticket category.
  const byCategory = new Map<string, { name: string; qty: number; price: number; currency: string }>();
  for (const a of booking.attendees) {
    const existing = byCategory.get(a.ticketCategoryId);
    if (existing) {
      existing.qty += 1;
    } else {
      byCategory.set(a.ticketCategoryId, {
        name: a.ticketCategory.name,
        qty: 1,
        price: a.ticketCategory.price,
        currency: booking.currency,
      });
    }
  }
  const lineItems = [...byCategory.values()];

  const orderSummary = (
    <Card className="p-6 mb-6">
      <h2 className="font-semibold text-gray-900 mb-3">Order summary</h2>
      <p className="text-sm text-gray-500 mb-3">{booking.event.name}</p>
      <div className="space-y-2 text-sm mb-3">
        {lineItems.map((item) => (
          <div key={item.name} className="flex justify-between">
            <span>{item.qty} × {item.name}</span>
            <span>{formatMoney(item.price * item.qty, item.currency)}</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-sm border-t border-gray-100 pt-3">
        <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(booking.subtotal, booking.currency)}</span></div>
        {booking.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatMoney(booking.discountAmount, booking.currency)}</span></div>}
        {booking.feeAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Service fee</span><span>{formatMoney(booking.feeAmount, booking.currency)}</span></div>}
        <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-200"><span>Total amount payable</span><span>{booking.totalAmount === 0 ? "Free" : formatMoney(booking.totalAmount, booking.currency)}</span></div>
      </div>
    </Card>
  );

  if (booking.status === "PAYMENT_VERIFICATION_PENDING") {
    return (
      <Container className="py-12 max-w-2xl">
        <CheckoutSteps current={3} />
        <div className="text-center mb-8">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-2xl mb-4">✓</div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Submitted</h1>
          <p className="text-gray-500 mt-2 max-w-md mx-auto">
            Thank you. We have received your payment proof. Our team will verify your payment and you will receive an
            email once your booking has been approved.
          </p>
        </div>
        <Card className="p-6 mb-6 text-center">
          <p className="text-sm text-gray-500">Booking / Order Reference</p>
          <p className="font-bold text-gray-900 text-lg mb-3">{booking.bookingNumber}</p>
          <Badge color="amber">Payment Verification Pending</Badge>
        </Card>
        {orderSummary}
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

  const settings = await prisma.siteSetting.findMany({ where: { key: { in: ["payment_account_details", "payment_qr_image_url"] } } });
  const accountDetails = settings.find((s) => s.key === "payment_account_details")?.value ?? "";
  const qrImageUrl = settings.find((s) => s.key === "payment_qr_image_url")?.value ?? "";

  return (
    <Container className="py-10 max-w-2xl">
      <CheckoutSteps current={3} />
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Payment & Confirmation</h1>
      <p className="text-sm text-gray-500 mb-6">
        Booking {booking.bookingNumber} for {booking.event.name} · {booking.attendees.length} ticket(s)
      </p>

      {orderSummary}

      {booking.totalAmount === 0 ? (
        <FreeBookingConfirm bookingId={booking.id} reservationExpiresAt={booking.reservationExpiresAt?.toISOString() ?? null} />
      ) : (
        <PaymentDetailsForm
          bookingId={booking.id}
          totalAmount={booking.totalAmount}
          currency={booking.currency}
          reservationExpiresAt={booking.reservationExpiresAt?.toISOString() ?? null}
          accountDetails={accountDetails}
          qrImageUrl={qrImageUrl}
        />
      )}
    </Container>
  );
}

import { notFound } from "next/navigation";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getPermissions } from "@/lib/permissions";
import { Card, Badge, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime } from "@/lib/format";
import { formatStatusLabel } from "@/lib/booking-status";
import PaymentDecisionForm from "./payment-decision-form";

export const dynamic = "force-dynamic";

const paymentStatusColor: Record<string, "gray" | "green" | "red" | "amber"> = {
  AWAITING_VERIFICATION: "amber",
  SUCCEEDED: "green",
  FAILED: "red",
};

export default async function PaymentVerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const perms = getPermissions(session!.role);

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          event: true,
          attendees: { include: { ticketCategory: true } },
        },
      },
      reviewedBy: true,
    },
  });
  if (!payment) notFound();

  const booking = payment.booking;

  return (
    <div>
      <SectionHeading title="Payment verification" description={booking.bookingNumber} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{booking.event.name}</h2>
              <Badge color={paymentStatusColor[payment.status] ?? "gray"}>{formatStatusLabel(payment.status)}</Badge>
            </div>
            <div className="text-sm space-y-1 text-gray-600">
              <p><span className="text-gray-400">Customer:</span> {booking.buyerName} ({booking.buyerEmail})</p>
              <p><span className="text-gray-400">Event date:</span> {formatEventDateTime(booking.event.startAt, booking.event.timezone)}</p>
              <p><span className="text-gray-400">Amount payable:</span> {formatMoney(payment.amount, payment.currency)}</p>
              <p><span className="text-gray-400">Payment reference:</span> {payment.reference}</p>
              {payment.failureReason && <p><span className="text-gray-400">Rejection reason:</span> {payment.failureReason}</p>}
              {payment.reviewedBy && <p><span className="text-gray-400">Reviewed by:</span> {payment.reviewedBy.fullName}</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Order</h2>
            <div className="space-y-2">
              {booking.attendees.map((a) => (
                <div key={a.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                  <span>{a.fullName} ({a.ticketCategory.name})</span>
                  <span>{formatMoney(a.ticketCategory.price, booking.currency)}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Uploaded payment screenshot</h2>
            {payment.proofImageUrl ? (
              <a href={payment.proofImageUrl} target="_blank" rel="noopener noreferrer">
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                  <Image src={payment.proofImageUrl} alt="Payment screenshot" fill className="object-contain" unoptimized />
                </div>
              </a>
            ) : (
              <p className="text-sm text-gray-400">No screenshot on file.</p>
            )}
          </Card>
        </div>

        {payment.status === "AWAITING_VERIFICATION" ? (
          perms.payments === "full" ? (
            <PaymentDecisionForm paymentId={payment.id} />
          ) : (
            <Card className="p-6">
              <p className="text-sm text-gray-500">You have view-only access — an Admin or Finance Manager must approve or reject this payment.</p>
            </Card>
          )
        ) : (
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Decision</h2>
            <p className="text-sm text-gray-600">
              {payment.status === "SUCCEEDED" ? "Payment approved and booking confirmed." : "Payment rejected."}
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { refundStatusColor, formatStatusLabel } from "@/lib/booking-status";
import { getTicketEligibility } from "@/lib/refunds";
import RefundDecisionForm from "./refund-decision-form";

export const dynamic = "force-dynamic";

export default async function RefundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const refund = await prisma.refund.findUnique({
    where: { id },
    include: {
      booking: { include: { event: true, payments: true } },
      payment: true,
      ticketLinks: { include: { ticket: { include: { attendee: true, ticketCategory: true } } } },
      requestedBy: true,
    },
  });
  if (!refund) notFound();

  const eligibilities = await Promise.all(refund.ticketLinks.map((l) => getTicketEligibility(l.ticket.id)));
  const hasIneligibleTicket = refund.status === "PENDING" && eligibilities.some((e) => !e.eligible);

  return (
    <div>
      <SectionHeading title="Refund request" description={refund.booking.bookingNumber} />
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{refund.booking.event.name}</h2>
              <Badge color={refundStatusColor[refund.status]}>{formatStatusLabel(refund.status)}</Badge>
            </div>
            <div className="text-sm space-y-1 text-gray-600">
              <p><span className="text-gray-400">Buyer:</span> {refund.booking.buyerName} ({refund.booking.buyerEmail})</p>
              <p><span className="text-gray-400">Requested:</span> {formatMoney(refund.requestedAmount, refund.booking.currency)}</p>
              <p><span className="text-gray-400">Reason:</span> {refund.reason}</p>
              {refund.additionalNotes && <p><span className="text-gray-400">Details:</span> {refund.additionalNotes}</p>}
              {refund.approvedAmount !== null && <p><span className="text-gray-400">Approved amount:</span> {formatMoney(refund.approvedAmount, refund.booking.currency)}</p>}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Tickets in this request</h2>
            <div className="space-y-2">
              {refund.ticketLinks.map((l, i) => (
                <div key={l.id} className="flex items-center justify-between text-sm border-b border-gray-50 pb-2">
                  <span>{l.ticket.attendee.fullName} ({l.ticket.ticketCategory.name})</span>
                  <Badge color={eligibilities[i].eligible ? "green" : "amber"}>{eligibilities[i].eligible ? "Within policy" : "Outside policy"}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3">Payment history</h2>
            {refund.booking.payments.map((p) => (
              <div key={p.id} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                <span>{p.reference}</span>
                <span>{formatMoney(p.amount, p.currency)}</span>
              </div>
            ))}
          </Card>
        </div>

        {refund.status === "PENDING" ? (
          <RefundDecisionForm refundId={refund.id} requestedAmount={refund.requestedAmount} hasIneligibleTicket={hasIneligibleTicket} />
        ) : (
          <Card className="p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Decision</h2>
            <p className="text-sm text-gray-600">{refund.customerMessage}</p>
            {refund.adminNotes && <p className="text-sm text-gray-400 mt-2">Internal: {refund.adminNotes}</p>}
            {refund.isOverride && <p className="text-sm text-amber-700 mt-2">Override reason: {refund.overrideReason}</p>}
          </Card>
        )}
      </div>
    </div>
  );
}

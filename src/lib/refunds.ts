import { prisma } from "./prisma";
import { evaluateTicketRefundEligibility } from "./refund-policy";
import { sendEmail, emailTemplates } from "./email";
import { logActivity } from "./activity";
import { refundSimulatedPayment } from "./booking-engine";
import { formatMoney } from "./money";

export class RefundError extends Error {}

export async function getTicketEligibility(ticketId: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { event: true, ticketCategory: true },
  });
  return evaluateTicketRefundEligibility({
    now: new Date(),
    eventStartAt: ticket.event.startAt,
    eventEndAt: ticket.event.endAt,
    eventStatus: ticket.event.status,
    refundDeadlineHours: ticket.event.refundDeadlineHours,
    categoryRefundEligible: ticket.ticketCategory.refundEligible,
    ticketStatus: ticket.status,
  });
}

export async function requestRefund(params: {
  bookingId: string;
  ticketIds: string[];
  reason: string;
  additionalNotes?: string;
  requestedById?: string;
}) {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: params.bookingId },
    include: { tickets: { include: { ticketCategory: true } }, payments: true, event: true },
  });

  if (params.ticketIds.length === 0) throw new RefundError("Select at least one ticket to refund.");

  const existingPendingTicketIds = new Set(
    (
      await prisma.refundTicket.findMany({
        where: { ticket: { bookingId: booking.id }, refund: { status: "PENDING" } },
        select: { ticketId: true },
      })
    ).map((r) => r.ticketId)
  );

  let requestedAmount = 0;
  for (const ticketId of params.ticketIds) {
    if (existingPendingTicketIds.has(ticketId)) {
      throw new RefundError("One or more selected tickets already have a pending refund request.");
    }
    const ticket = booking.tickets.find((t) => t.id === ticketId);
    if (!ticket) throw new RefundError("Ticket not found in this booking.");
    const eligibility = await getTicketEligibility(ticketId);
    if (!eligibility.eligible) {
      throw new RefundError(eligibility.reasonMessage || "This ticket is not eligible for a refund.");
    }
    requestedAmount += ticket.price;
  }

  const successfulPayment = booking.payments.find((p) => p.succeededAt !== null);
  if (!successfulPayment) throw new RefundError("No successful payment found for this booking.");

  const refund = await prisma.refund.create({
    data: {
      bookingId: booking.id,
      paymentId: successfulPayment.id,
      requestedById: params.requestedById,
      requestedAmount,
      reason: params.reason,
      additionalNotes: params.additionalNotes,
      status: "PENDING",
      ticketLinks: { create: params.ticketIds.map((ticketId) => ({ ticketId })) },
    },
  });

  await sendEmail({
    toEmail: booking.buyerEmail,
    subject: `Refund request received — ${booking.bookingNumber}`,
    bodyHtml: emailTemplates.refundRequested({
      buyerName: booking.buyerName,
      bookingNumber: booking.bookingNumber,
      amount: formatMoney(requestedAmount, booking.currency),
    }),
    previewText: "We received your refund request",
    category: "REFUND_REQUESTED",
    relatedBookingId: booking.id,
    relatedEventId: booking.eventId,
  });

  await logActivity({
    actorId: params.requestedById ?? null,
    actorName: booking.buyerName,
    action: "refund.requested",
    entityType: "REFUND",
    entityId: refund.id,
    description: `Refund requested for ${params.ticketIds.length} ticket(s) on booking ${booking.bookingNumber}.`,
    reason: params.reason,
  });

  return refund;
}

export async function decideRefund(params: {
  refundId: string;
  decision: "APPROVE_FULL" | "APPROVE_PARTIAL" | "REJECT";
  approvedAmount?: number;
  adminNotes?: string;
  customerMessage?: string;
  isOverride?: boolean;
  overrideReason?: string;
  decidedById: string;
  decidedByName: string;
}) {
  const refund = await prisma.refund.findUniqueOrThrow({
    where: { id: params.refundId },
    include: {
      booking: { include: { event: true, tickets: true } },
      payment: true,
      ticketLinks: { include: { ticket: true } },
    },
  });

  if (refund.status !== "PENDING") throw new RefundError("This refund request has already been decided.");

  if (params.isOverride && !params.overrideReason?.trim()) {
    throw new RefundError("An override reason is required.");
  }

  if (params.decision === "REJECT") {
    await prisma.refund.update({
      where: { id: refund.id },
      data: {
        status: "REJECTED",
        adminNotes: params.adminNotes,
        customerMessage: params.customerMessage,
        decidedById: params.decidedById,
        decidedAt: new Date(),
      },
    });
    await sendEmail({
      toEmail: refund.booking.buyerEmail,
      subject: `Refund request update — ${refund.booking.bookingNumber}`,
      bodyHtml: emailTemplates.refundDecision({
        buyerName: refund.booking.buyerName,
        bookingNumber: refund.booking.bookingNumber,
        status: "REJECTED",
        amount: formatMoney(0, refund.booking.currency),
        message: params.customerMessage,
      }),
      previewText: "Update on your refund request",
      category: "REFUND_REJECTED",
      relatedBookingId: refund.bookingId,
    });
    await logActivity({
      actorId: params.decidedById,
      actorName: params.decidedByName,
      action: "refund.rejected",
      entityType: "REFUND",
      entityId: refund.id,
      description: `Refund request rejected for booking ${refund.booking.bookingNumber}.`,
      reason: params.overrideReason,
    });
    return refund.id;
  }

  const approvedAmount =
    params.decision === "APPROVE_FULL" ? refund.requestedAmount : Math.min(params.approvedAmount ?? 0, refund.requestedAmount);
  if (approvedAmount <= 0) throw new RefundError("Enter a valid approved amount.");

  await refundSimulatedPayment(refund.payment.reference, approvedAmount);

  const finalStatus = params.decision === "APPROVE_FULL" ? "COMPLETED" : "PARTIALLY_APPROVED";

  await prisma.$transaction(async (tx) => {
    await tx.refund.update({
      where: { id: refund.id },
      data: {
        status: finalStatus,
        approvedAmount,
        adminNotes: params.adminNotes,
        customerMessage: params.customerMessage,
        isOverride: params.isOverride ?? false,
        overrideReason: params.overrideReason,
        decidedById: params.decidedById,
        decidedAt: new Date(),
      },
    });

    for (const link of refund.ticketLinks) {
      await tx.ticket.update({ where: { id: link.ticketId }, data: { status: "REFUNDED", refundId: refund.id } });
      if (refund.booking.event.returnRefundsToInventory) {
        await tx.ticketCategory.update({
          where: { id: link.ticket.ticketCategoryId },
          data: { quantitySold: { decrement: 1 }, status: "ACTIVE" },
        });
      }
    }

    const allTickets = await tx.ticket.findMany({ where: { bookingId: refund.bookingId } });
    const allRefunded = allTickets.every((t) => t.status === "REFUNDED" || t.status === "CANCELLED");
    await tx.booking.update({
      where: { id: refund.bookingId },
      data: { status: allRefunded ? "FULLY_REFUNDED" : "PARTIALLY_REFUNDED" },
    });

    const payment = refund.payment;
    const alreadyRefunded = await tx.refund.aggregate({
      where: { paymentId: payment.id, status: { in: ["COMPLETED", "PARTIALLY_APPROVED"] } },
      _sum: { approvedAmount: true },
    });
    const totalRefunded = alreadyRefunded._sum.approvedAmount ?? 0;
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: totalRefunded >= payment.amount ? "REFUNDED" : "PARTIALLY_REFUNDED" },
    });
  });

  await sendEmail({
    toEmail: refund.booking.buyerEmail,
    subject: `Refund ${finalStatus === "COMPLETED" ? "completed" : "partially approved"} — ${refund.booking.bookingNumber}`,
    bodyHtml: emailTemplates.refundDecision({
      buyerName: refund.booking.buyerName,
      bookingNumber: refund.booking.bookingNumber,
      status: finalStatus,
      amount: formatMoney(approvedAmount, refund.booking.currency),
      message: params.customerMessage,
    }),
    previewText: "Your refund has been processed",
    category: finalStatus === "COMPLETED" ? "REFUND_COMPLETED" : "REFUND_PARTIALLY_APPROVED",
    relatedBookingId: refund.bookingId,
  });

  await logActivity({
    actorId: params.decidedById,
    actorName: params.decidedByName,
    action: params.isOverride ? "refund.approved.override" : "refund.approved",
    entityType: "REFUND",
    entityId: refund.id,
    description: `Refund of ${formatMoney(approvedAmount, refund.booking.currency)} approved for booking ${refund.booking.bookingNumber}.`,
    reason: params.overrideReason,
  });

  return refund.id;
}

import { prisma } from "./prisma";

// Manual bank-transfer payments take longer to complete than an instant
// card/wallet charge, so the initial hold window is generous enough to let a
// customer make the transfer and upload a screenshot before it expires. Once
// a screenshot is submitted the booking moves to PAYMENT_VERIFICATION_PENDING
// and is held indefinitely (see the held-count queries below) until an admin
// approves or rejects it — no time pressure during manual review.
export const RESERVATION_HOLD_MINUTES = 30;

// Flips any expired pending-payment bookings to EXPIRED, releasing their
// held inventory. Cheap enough to call on every availability check / booking
// creation; also exposed as an admin-triggered job for the whole system.
export async function releaseExpiredHolds(eventId?: string) {
  const now = new Date();
  const result = await prisma.booking.updateMany({
    where: {
      status: "PENDING_PAYMENT",
      reservationExpiresAt: { lt: now },
      ...(eventId ? { eventId } : {}),
    },
    data: { status: "EXPIRED" },
  });
  return result.count;
}

export async function getCategoryAvailability(ticketCategoryId: string) {
  await releaseExpiredHolds();
  const category = await prisma.ticketCategory.findUniqueOrThrow({ where: { id: ticketCategoryId } });

  const held = await prisma.attendee.count({
    where: {
      ticketCategoryId,
      booking: {
        OR: [
          { status: "PENDING_PAYMENT", reservationExpiresAt: { gt: new Date() } },
          { status: "PAYMENT_VERIFICATION_PENDING" },
        ],
      },
    },
  });

  const remaining = Math.max(0, category.totalQuantity - category.quantitySold - held);
  return { category, held, remaining };
}

export async function getEventCapacityRemaining(eventId: string) {
  await releaseExpiredHolds(eventId);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });
  const confirmedTickets = await prisma.ticket.count({
    where: { eventId, status: { in: ["VALID", "CHECKED_IN"] } },
  });
  const held = await prisma.attendee.count({
    where: {
      booking: {
        eventId,
        OR: [
          { status: "PENDING_PAYMENT", reservationExpiresAt: { gt: new Date() } },
          { status: "PAYMENT_VERIFICATION_PENDING" },
        ],
      },
    },
  });
  return Math.max(0, event.capacity - confirmedTickets - held);
}

// Customer-facing label only — deliberately binary (no counts, percentages,
// or "almost sold out" scarcity hints). Backend inventory tracking above is
// unaffected and still enforces the real remaining count.
export function categoryStatusLabel(status: string, remaining: number): string {
  if (status === "CLOSED") return "Sales closed";
  if (status === "PAUSED") return "Sales paused";
  if (remaining <= 0) return "Sold out";
  return "Available";
}

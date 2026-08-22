import { prisma } from "./prisma";

export const RESERVATION_HOLD_MINUTES = 12;

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
      booking: { status: "PENDING_PAYMENT", reservationExpiresAt: { gt: new Date() } },
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
      booking: { eventId, status: "PENDING_PAYMENT", reservationExpiresAt: { gt: new Date() } },
    },
  });
  return Math.max(0, event.capacity - confirmedTickets - held);
}

export function categoryStatusLabel(status: string, remaining: number): string {
  if (status === "CLOSED") return "Sales closed";
  if (status === "PAUSED") return "Sales paused";
  if (remaining <= 0) return "Sold out";
  if (remaining <= 10) return "Almost sold out";
  return "Available";
}

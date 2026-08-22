"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validateTicket, checkInTicket, undoCheckIn } from "@/lib/checkin";

async function assertEventAccess(eventId: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  if (session.role === "ADMIN" || session.role === "BOOKING_MANAGER") return session;
  if (session.role !== "CHECKIN_STAFF") throw new Error("FORBIDDEN");
  const assigned = await prisma.eventAssignment.findFirst({ where: { userId: session.userId, eventId } });
  if (!assigned) throw new Error("FORBIDDEN");
  return session;
}

export async function validateTicketAction(codeOrNumber: string, eventId: string) {
  await assertEventAccess(eventId);
  const result = await validateTicket(codeOrNumber, eventId);
  return {
    outcome: result.outcome,
    message: result.message,
    ticket: result.ticket
      ? {
          id: result.ticket.id,
          ticketNumber: result.ticket.ticketNumber,
          attendeeName: result.ticket.attendee.fullName,
          categoryName: result.ticket.ticketCategory.name,
          eventName: result.ticket.event.name,
          status: result.ticket.status,
          checkedInAt: result.ticket.checkedInAt?.toISOString() ?? null,
          checkedInByName: result.ticket.checkedInBy?.fullName ?? null,
        }
      : null,
  };
}

export async function checkInTicketAction(ticketId: string, eventId: string) {
  const session = await assertEventAccess(eventId);
  const ticket = await checkInTicket(ticketId, session.userId, session.fullName);
  return { ok: true as const, checkedInAt: ticket.checkedInAt?.toISOString() };
}

export async function undoCheckInAction(ticketId: string, eventId: string) {
  const session = await assertEventAccess(eventId);
  await undoCheckIn(ticketId, session.userId, session.fullName);
  return { ok: true as const };
}

export async function searchAttendeesAction(eventId: string, query: string) {
  await assertEventAccess(eventId);
  const tickets = await prisma.ticket.findMany({
    where: {
      eventId,
      OR: [
        { attendee: { fullName: { contains: query, mode: "insensitive" } } },
        { booking: { bookingNumber: { contains: query, mode: "insensitive" } } },
        { booking: { buyerName: { contains: query, mode: "insensitive" } } },
      ],
    },
    include: { attendee: true, ticketCategory: true, booking: true },
    take: 20,
  });
  return tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    attendeeName: t.attendee.fullName,
    categoryName: t.ticketCategory.name,
    bookingNumber: t.booking.bookingNumber,
    status: t.status,
  }));
}

export async function getAttendanceStatsAction(eventId: string) {
  await assertEventAccess(eventId);
  const [total, checkedIn] = await Promise.all([
    prisma.ticket.count({ where: { eventId, status: { in: ["VALID", "CHECKED_IN"] } } }),
    prisma.ticket.count({ where: { eventId, status: "CHECKED_IN" } }),
  ]);
  const recent = await prisma.ticket.findMany({
    where: { eventId, status: "CHECKED_IN" },
    include: { attendee: true },
    orderBy: { checkedInAt: "desc" },
    take: 10,
  });
  return { total, checkedIn, recent: recent.map((t) => ({ name: t.attendee.fullName, at: t.checkedInAt?.toISOString() ?? null })) };
}

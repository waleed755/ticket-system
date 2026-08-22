import { prisma } from "./prisma";
import { logActivity } from "./activity";

export type ValidationOutcome =
  | "VALID"
  | "ALREADY_CHECKED_IN"
  | "REFUNDED"
  | "CANCELLED"
  | "INVALID"
  | "EXPIRED"
  | "WRONG_EVENT"
  | "NOT_ACTIVE_YET";

export interface ValidationResult {
  outcome: ValidationOutcome;
  ticket?: Awaited<ReturnType<typeof lookupTicket>>;
  message: string;
}

async function lookupTicket(codeOrNumber: string) {
  return prisma.ticket.findFirst({
    where: { OR: [{ secureCode: codeOrNumber }, { ticketNumber: codeOrNumber }] },
    include: {
      attendee: true,
      event: true,
      ticketCategory: true,
      booking: true,
      checkedInBy: true,
    },
  });
}

export async function validateTicket(codeOrNumber: string, eventId: string): Promise<ValidationResult> {
  const ticket = await lookupTicket(codeOrNumber.trim());
  if (!ticket) return { outcome: "INVALID", message: "No ticket found with this code or number." };

  if (ticket.eventId !== eventId) {
    return { outcome: "WRONG_EVENT", ticket, message: `This ticket belongs to a different event: ${ticket.event.name}.` };
  }
  if (ticket.status === "REFUNDED") return { outcome: "REFUNDED", ticket, message: "This ticket has been refunded and is no longer valid." };
  if (ticket.status === "CANCELLED") return { outcome: "CANCELLED", ticket, message: "This ticket has been cancelled." };
  if (ticket.status === "EXPIRED") return { outcome: "EXPIRED", ticket, message: "This ticket has expired." };
  if (ticket.status === "CHECKED_IN") {
    return {
      outcome: "ALREADY_CHECKED_IN",
      ticket,
      message: `Already checked in on ${ticket.checkedInAt?.toLocaleString()} by ${ticket.checkedInBy?.fullName ?? "staff"}.`,
    };
  }
  if (ticket.event.status === "CANCELLED") return { outcome: "INVALID", ticket, message: "This event has been cancelled." };

  const now = new Date();
  const earlyEntryWindow = new Date(ticket.event.startAt.getTime() - 3 * 60 * 60 * 1000);
  if (now < earlyEntryWindow) {
    return { outcome: "NOT_ACTIVE_YET", ticket, message: "This ticket is not active yet — entry opens closer to the event start time." };
  }

  return { outcome: "VALID", ticket, message: "Valid ticket." };
}

export async function checkInTicket(ticketId: string, staffId: string, staffName: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: { attendee: true, event: true } });
  if (ticket.status === "CHECKED_IN") throw new Error("Ticket already checked in.");
  if (ticket.status !== "VALID") throw new Error(`Cannot check in a ${ticket.status.toLowerCase()} ticket.`);

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInById: staffId, checkInUndoneAt: null, checkInUndoneById: null },
  });

  await logActivity({
    actorId: staffId,
    actorName: staffName,
    action: "ticket.checked_in",
    entityType: "TICKET",
    entityId: ticketId,
    description: `${ticket.attendee.fullName} checked in for ${ticket.event.name}.`,
  });

  return updated;
}

export async function undoCheckIn(ticketId: string, staffId: string, staffName: string) {
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId }, include: { attendee: true, event: true } });
  if (ticket.status !== "CHECKED_IN") throw new Error("Ticket is not currently checked in.");

  const updated = await prisma.ticket.update({
    where: { id: ticketId },
    data: { status: "VALID", checkInUndoneAt: new Date(), checkInUndoneById: staffId },
  });

  await logActivity({
    actorId: staffId,
    actorName: staffName,
    action: "ticket.checkin_undone",
    entityType: "TICKET",
    entityId: ticketId,
    description: `Check-in undone for ${ticket.attendee.fullName} (${ticket.event.name}).`,
  });

  return updated;
}

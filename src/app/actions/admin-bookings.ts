"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { generateBookingNumber, generateTicketNumber, generateSecureTicketCode, generatePaymentReference } from "@/lib/ids";
import { formatMoney } from "@/lib/money";

const STAFF = ["ADMIN", "BOOKING_MANAGER", "SUPPORT", "EVENT_MANAGER", "FINANCE_MANAGER"] as const;

export async function addBookingNoteAction(bookingId: string, note: string) {
  const session = await requireRole([...STAFF]);
  await prisma.bookingNote.create({ data: { bookingId, authorId: session.userId, note } });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "booking.note_added", entityType: "BOOKING", entityId: bookingId, description: "Internal note added." });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function resendTicketsAdminAction(bookingId: string) {
  const session = await requireRole([...STAFF]);
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { event: true, tickets: true } });
  await sendEmail({
    toEmail: booking.buyerEmail,
    subject: `Your tickets — ${booking.event.name}`,
    bodyHtml: emailTemplates.bookingConfirmation({
      buyerName: booking.buyerName,
      eventName: booking.event.name,
      bookingNumber: booking.bookingNumber,
      eventDate: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: booking.event.timezone }).format(booking.event.startAt),
      venue: booking.event.format === "ONLINE" ? "Online event" : booking.event.venueName || "",
      ticketCount: booking.tickets.length,
      total: formatMoney(booking.totalAmount, booking.currency),
      bookingUrl: `${process.env.APP_URL}/account/bookings/${booking.id}`,
    }),
    previewText: "Your tickets, resent by our team",
    category: "TICKET_DELIVERY",
    relatedBookingId: booking.id,
  });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "booking.tickets_resent", entityType: "BOOKING", entityId: bookingId, description: "Tickets resent by staff." });
  return { ok: true as const };
}

export async function cancelBookingAction(bookingId: string, reason: string) {
  const session = await requireRole([...STAFF]);
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId }, include: { event: true, tickets: true } });

  await prisma.$transaction(async (tx) => {
    await tx.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason: reason } });
    await tx.ticket.updateMany({ where: { bookingId, status: "VALID" }, data: { status: "CANCELLED" } });
    if (booking.event.returnRefundsToInventory) {
      for (const t of booking.tickets.filter((t) => t.status === "VALID")) {
        await tx.ticketCategory.update({ where: { id: t.ticketCategoryId }, data: { quantitySold: { decrement: 1 }, status: "ACTIVE" } });
      }
    }
  });

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "booking.cancelled",
    entityType: "BOOKING",
    entityId: bookingId,
    description: `Booking ${booking.bookingNumber} cancelled by staff.`,
    reason,
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function invalidateTicketAction(ticketId: string, bookingId: string, reason: string) {
  const session = await requireRole([...STAFF]);
  const ticket = await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
  await prisma.ticket.update({ where: { id: ticketId }, data: { status: "INVALID" } });
  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "ticket.invalidated",
    entityType: "TICKET",
    entityId: ticketId,
    description: `Ticket ${ticket.ticketNumber} manually invalidated.`,
    reason,
  });
  revalidatePath(`/admin/bookings/${bookingId}`);
  return { ok: true as const };
}

export async function createManualBookingAction(input: {
  eventId: string;
  ticketCategoryId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  attendeeNames: string[];
  isComplimentary: boolean;
}) {
  const session = await requireRole(["ADMIN", "BOOKING_MANAGER", "EVENT_MANAGER"]);
  const category = await prisma.ticketCategory.findUniqueOrThrow({ where: { id: input.ticketCategoryId } });

  const booking = await prisma.$transaction(async (tx) => {
    const b = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        eventId: input.eventId,
        buyerName: input.buyerName,
        buyerEmail: input.buyerEmail.toLowerCase(),
        buyerPhone: input.buyerPhone,
        status: "CONFIRMED",
        subtotal: input.isComplimentary ? 0 : category.price * input.attendeeNames.length,
        totalAmount: input.isComplimentary ? 0 : category.price * input.attendeeNames.length,
        currency: category.currency,
        termsAcceptedAt: new Date(),
        isManual: true,
        attendees: {
          create: input.attendeeNames.map((name) => ({ ticketCategoryId: input.ticketCategoryId, fullName: name, isBuyer: false })),
        },
      },
      include: { attendees: true },
    });

    await tx.payment.create({
      data: {
        bookingId: b.id,
        amount: b.totalAmount,
        currency: b.currency,
        status: "SUCCEEDED",
        method: input.isComplimentary ? "complimentary" : "manual",
        reference: generatePaymentReference(),
        succeededAt: new Date(),
      },
    });

    for (const attendee of b.attendees) {
      await tx.ticket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          secureCode: generateSecureTicketCode(),
          bookingId: b.id,
          attendeeId: attendee.id,
          eventId: input.eventId,
          ticketCategoryId: input.ticketCategoryId,
          status: "VALID",
          price: input.isComplimentary ? 0 : category.price,
        },
      });
      await tx.ticketCategory.update({ where: { id: input.ticketCategoryId }, data: { quantitySold: { increment: 1 } } });
    }

    return b;
  });

  let user = await prisma.user.findUnique({ where: { email: booking.buyerEmail } });
  if (!user) {
    user = await prisma.user.create({ data: { email: booking.buyerEmail, role: "CUSTOMER", status: "PENDING_ACTIVATION", fullName: booking.buyerName, phone: booking.buyerPhone } });
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { customerId: user.id } });

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "booking.manual_created",
    entityType: "BOOKING",
    entityId: booking.id,
    description: `Manual ${input.isComplimentary ? "complimentary " : ""}booking created for ${booking.buyerName} (${input.attendeeNames.length} ticket(s)).`,
  });

  revalidatePath("/admin/bookings");
  return { ok: true as const, bookingId: booking.id };
}

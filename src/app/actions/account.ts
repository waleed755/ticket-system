"use server";

import { prisma } from "@/lib/prisma";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { requestRefund, RefundError } from "@/lib/refunds";
import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { formatMoney } from "@/lib/money";

async function requireOwnedBooking(bookingId: string) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
  if (booking.customerId !== session.userId) throw new Error("FORBIDDEN");
  return { session, booking };
}

export async function requestRefundAction(input: { bookingId: string; ticketIds: string[]; reason: string; additionalNotes?: string }) {
  try {
    const { session } = await requireOwnedBooking(input.bookingId);
    await requestRefund({ ...input, requestedById: session.userId });
    revalidatePath(`/account/bookings/${input.bookingId}`);
    return { ok: true as const };
  } catch (err) {
    if (err instanceof RefundError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Something went wrong submitting your refund request." };
  }
}

export async function resendTicketsAction(bookingId: string) {
  const { booking } = await requireOwnedBooking(bookingId);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: booking.eventId } });
  await sendEmail({
    toEmail: booking.buyerEmail,
    subject: `Your tickets — ${event.name}`,
    bodyHtml: emailTemplates.bookingConfirmation({
      buyerName: booking.buyerName,
      eventName: event.name,
      bookingNumber: booking.bookingNumber,
      eventDate: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: event.timezone }).format(event.startAt),
      venue: event.format === "ONLINE" ? "Online event" : event.venueName || "",
      ticketCount: (await prisma.ticket.count({ where: { bookingId } })),
      total: formatMoney(booking.totalAmount, booking.currency),
      bookingUrl: `${process.env.APP_URL}/account/bookings/${booking.id}`,
    }),
    previewText: "Your tickets, resent",
    category: "TICKET_DELIVERY",
    relatedBookingId: booking.id,
  });
  return { ok: true as const };
}

export async function updateAttendeeAction(input: {
  attendeeId: string;
  bookingId: string;
  email?: string;
  phone?: string;
  dietaryNeeds?: string;
  accessibilityNeeds?: string;
  emergencyContact?: string;
}) {
  await requireOwnedBooking(input.bookingId);
  await prisma.attendee.update({
    where: { id: input.attendeeId },
    data: {
      email: input.email,
      phone: input.phone,
      dietaryNeeds: input.dietaryNeeds,
      accessibilityNeeds: input.accessibilityNeeds,
      emergencyContact: input.emergencyContact,
    },
  });
  revalidatePath(`/account/bookings/${input.bookingId}`);
  return { ok: true as const };
}

export async function updateProfileAction(input: { fullName: string; phone: string }) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  await prisma.user.update({ where: { id: session.userId }, data: { fullName: input.fullName, phone: input.phone } });
  return { ok: true as const };
}

export async function changePasswordAction(input: { currentPassword: string; newPassword: string }) {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.userId } });
  if (!user.passwordHash || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    return { ok: false as const, message: "Current password is incorrect." };
  }
  if (input.newPassword.length < 8) return { ok: false as const, message: "New password must be at least 8 characters." };
  const passwordHash = await hashPassword(input.newPassword);
  await prisma.user.update({ where: { id: session.userId }, data: { passwordHash } });
  return { ok: true as const };
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function sendAnnouncementAction(input: { eventId: string; subject: string; message: string; ticketCategoryIds: string[] }) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER", "SUPPORT"]);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: input.eventId } });

  const bookings = await prisma.booking.findMany({
    where: {
      eventId: input.eventId,
      status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] },
      ...(input.ticketCategoryIds.length > 0 ? { attendees: { some: { ticketCategoryId: { in: input.ticketCategoryIds } } } } : {}),
    },
  });

  const announcement = await prisma.announcement.create({
    data: {
      eventId: input.eventId,
      subject: input.subject,
      message: input.message,
      audience: input.ticketCategoryIds.length > 0 ? "CATEGORY" : "ALL",
      ticketCategoryIds: input.ticketCategoryIds.length > 0 ? JSON.stringify(input.ticketCategoryIds) : null,
      status: "SENT",
      sentAt: new Date(),
      createdById: session.userId,
    },
  });

  for (const b of bookings) {
    await sendEmail({
      toEmail: b.buyerEmail,
      subject: input.subject,
      bodyHtml: emailTemplates.announcement({ buyerName: b.buyerName, eventName: event.name, message: input.message }),
      previewText: input.subject,
      category: "EVENT_ANNOUNCEMENT",
      relatedBookingId: b.id,
      relatedEventId: input.eventId,
    });
  }

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "announcement.sent",
    entityType: "EVENT",
    entityId: input.eventId,
    description: `Announcement "${input.subject}" sent to ${bookings.length} booking(s) for ${event.name}.`,
  });

  revalidatePath("/admin/communications");
  return { ok: true as const, recipientCount: bookings.length, announcementId: announcement.id };
}

export async function updateContactMessageStatusAction(id: string, status: "NEW" | "IN_PROGRESS" | "RESOLVED") {
  await requireRole(["ADMIN", "SUPPORT"]);
  await prisma.contactMessage.update({ where: { id }, data: { status } });
  revalidatePath("/admin/contact-messages");
  return { ok: true as const };
}

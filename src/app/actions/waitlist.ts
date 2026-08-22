"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function joinWaitlistAction(input: { eventId: string; ticketCategoryId?: string; name: string; email: string; phone?: string }) {
  const event = await prisma.event.findUniqueOrThrow({ where: { id: input.eventId } });
  const entry = await prisma.waitlistEntry.create({
    data: { eventId: input.eventId, ticketCategoryId: input.ticketCategoryId, name: input.name, email: input.email.toLowerCase(), phone: input.phone },
  });

  await sendEmail({
    toEmail: input.email,
    subject: `You're on the waiting list — ${event.name}`,
    bodyHtml: emailTemplates.waitlistConfirmation({ name: input.name, eventName: event.name }),
    previewText: "You've joined the waiting list",
    category: "WAITLIST_CONFIRMATION",
    relatedEventId: input.eventId,
  });

  return { ok: true as const, entryId: entry.id };
}

export async function notifyWaitlistEntryAction(entryId: string) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const entry = await prisma.waitlistEntry.update({ where: { id: entryId }, data: { status: "NOTIFIED", notifiedAt: new Date() }, include: { event: true } });

  await sendEmail({
    toEmail: entry.email,
    subject: `Tickets available — ${entry.event.name}`,
    bodyHtml: emailTemplates.waitlistAvailable({ name: entry.name, eventName: entry.event.name, bookingUrl: `${process.env.APP_URL}/book/${entry.event.slug}` }),
    previewText: "Tickets are available",
    category: "WAITLIST_AVAILABILITY",
    relatedEventId: entry.eventId,
  });

  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "waitlist.notified", entityType: "EVENT", entityId: entry.eventId, description: `Waitlist entry for ${entry.name} notified of availability.` });
  revalidatePath(`/admin/events/${entry.eventId}/waitlist`);
  return { ok: true as const };
}

"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, getSession } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendEmail, emailTemplates } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { generateAccessCode } from "@/lib/ids";
import { fromZonedTime } from "date-fns-tz";

// Admin datetime-local inputs carry a naive "YYYY-MM-DDTHH:mm" string that
// represents wall-clock time in the event's own timezone (not the browser's
// or server's), so every stored instant must be converted explicitly.
function zonedInputToDate(value: string, timezone: string): Date {
  return fromZonedTime(value, timezone);
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export interface EventFormInput {
  name: string;
  shortDescription: string;
  fullDescription: string;
  categoryId: string;
  coverImage: string;
  images: string[];
  format: "PHYSICAL" | "ONLINE" | "HYBRID";
  venueName?: string;
  addressLine1?: string;
  city?: string;
  region?: string;
  country?: string;
  postalCode?: string;
  mapUrl?: string;
  onlineUrl?: string;
  onlineInstructions?: string;
  startAt: string;
  endAt: string;
  timezone: string;
  capacity: number;
  bookingStartAt: string;
  bookingEndAt: string;
  refundDeadlineHours: number;
  refundPolicy: string;
  termsAndConditions: string;
  ageRestriction?: string;
  entryRequirements?: string;
  dressCode?: string;
  accessibilityInfo?: string;
  organizerName: string;
  organizerEmail: string;
  organizerPhone?: string;
  organizerBio?: string;
  confirmationMessage?: string;
  visibility: "PUBLIC" | "PRIVATE";
  accessCode?: string;
  waitlistEnabled: boolean;
  featured: boolean;
  returnRefundsToInventory: boolean;
  faqs: { question: string; answer: string }[];
  questions: { label: string; type: string; options: string; required: boolean }[];
  ticketCategories: {
    id?: string;
    name: string;
    description: string;
    price: number;
    totalQuantity: number;
    minPerOrder: number;
    maxPerOrder: number;
    refundEligible: boolean;
    benefits: string;
  }[];
}

export async function createEventAction(input: EventFormInput) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const baseSlug = slugify(input.name);
  let slug = baseSlug;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const event = await prisma.event.create({
    data: {
      slug,
      name: input.name,
      shortDescription: input.shortDescription,
      fullDescription: input.fullDescription,
      categoryId: input.categoryId,
      coverImage: input.coverImage,
      format: input.format,
      venueName: input.venueName,
      addressLine1: input.addressLine1,
      city: input.city,
      region: input.region,
      country: input.country,
      postalCode: input.postalCode,
      mapUrl: input.mapUrl,
      onlineUrl: input.onlineUrl,
      onlineInstructions: input.onlineInstructions,
      startAt: zonedInputToDate(input.startAt, input.timezone),
      endAt: zonedInputToDate(input.endAt, input.timezone),
      timezone: input.timezone,
      capacity: input.capacity,
      bookingStartAt: zonedInputToDate(input.bookingStartAt, input.timezone),
      bookingEndAt: zonedInputToDate(input.bookingEndAt, input.timezone),
      refundDeadlineHours: input.refundDeadlineHours,
      refundPolicy: input.refundPolicy,
      termsAndConditions: input.termsAndConditions,
      ageRestriction: input.ageRestriction,
      entryRequirements: input.entryRequirements,
      dressCode: input.dressCode,
      accessibilityInfo: input.accessibilityInfo,
      organizerName: input.organizerName,
      organizerEmail: input.organizerEmail,
      organizerPhone: input.organizerPhone,
      organizerBio: input.organizerBio,
      confirmationMessage: input.confirmationMessage,
      status: "DRAFT",
      visibility: input.visibility,
      accessCode: input.visibility === "PRIVATE" ? input.accessCode || generateAccessCode() : null,
      waitlistEnabled: input.waitlistEnabled,
      featured: input.featured,
      returnRefundsToInventory: input.returnRefundsToInventory,
      createdById: session.userId,
      images: { create: input.images.map((url, i) => ({ url, position: i })) },
      faqs: { create: input.faqs.map((f, i) => ({ ...f, position: i })) },
      questions: { create: input.questions.map((q, i) => ({ label: q.label, type: q.type as never, options: q.options || null, required: q.required, position: i })) },
      ticketCategories: {
        create: input.ticketCategories.map((c, i) => ({
          name: c.name,
          description: c.description,
          price: c.price,
          totalQuantity: c.totalQuantity,
          minPerOrder: c.minPerOrder,
          maxPerOrder: c.maxPerOrder,
          refundEligible: c.refundEligible,
          benefits: c.benefits,
          position: i,
        })),
      },
      ...(session.role === "EVENT_MANAGER" ? { assignments: { create: [{ userId: session.userId, role: "EVENT_MANAGER" }] } } : {}),
    },
  });

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "event.created",
    entityType: "EVENT",
    entityId: event.id,
    description: `Created event "${event.name}" as draft.`,
  });

  revalidatePath("/admin/events");
  return { ok: true as const, eventId: event.id };
}

export async function updateEventAction(eventId: string, input: EventFormInput) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const before = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  await prisma.$transaction(async (tx) => {
    await tx.event.update({
      where: { id: eventId },
      data: {
        name: input.name,
        shortDescription: input.shortDescription,
        fullDescription: input.fullDescription,
        categoryId: input.categoryId,
        coverImage: input.coverImage,
        format: input.format,
        venueName: input.venueName,
        addressLine1: input.addressLine1,
        city: input.city,
        region: input.region,
        country: input.country,
        postalCode: input.postalCode,
        mapUrl: input.mapUrl,
        onlineUrl: input.onlineUrl,
        onlineInstructions: input.onlineInstructions,
        startAt: zonedInputToDate(input.startAt, input.timezone),
        endAt: zonedInputToDate(input.endAt, input.timezone),
        timezone: input.timezone,
        capacity: input.capacity,
        bookingStartAt: zonedInputToDate(input.bookingStartAt, input.timezone),
        bookingEndAt: zonedInputToDate(input.bookingEndAt, input.timezone),
        refundDeadlineHours: input.refundDeadlineHours,
        refundPolicy: input.refundPolicy,
        termsAndConditions: input.termsAndConditions,
        ageRestriction: input.ageRestriction,
        entryRequirements: input.entryRequirements,
        dressCode: input.dressCode,
        accessibilityInfo: input.accessibilityInfo,
        organizerName: input.organizerName,
        organizerEmail: input.organizerEmail,
        organizerPhone: input.organizerPhone,
        organizerBio: input.organizerBio,
        confirmationMessage: input.confirmationMessage,
        visibility: input.visibility,
        accessCode: input.visibility === "PRIVATE" ? input.accessCode || generateAccessCode() : null,
        waitlistEnabled: input.waitlistEnabled,
        featured: input.featured,
        returnRefundsToInventory: input.returnRefundsToInventory,
      },
    });

    await tx.eventImage.deleteMany({ where: { eventId } });
    await tx.eventImage.createMany({ data: input.images.map((url, i) => ({ eventId, url, position: i })) });

    await tx.eventFAQ.deleteMany({ where: { eventId } });
    await tx.eventFAQ.createMany({ data: input.faqs.map((f, i) => ({ eventId, ...f, position: i })) });

    await tx.eventAttendeeQuestion.deleteMany({ where: { eventId } });
    await tx.eventAttendeeQuestion.createMany({
      data: input.questions.map((q, i) => ({ eventId, label: q.label, type: q.type as never, options: q.options || null, required: q.required, position: i })),
    });

    const existingIds = (await tx.ticketCategory.findMany({ where: { eventId }, select: { id: true } })).map((c) => c.id);
    const keepIds = input.ticketCategories.filter((c) => c.id).map((c) => c.id as string);
    const removeIds = existingIds.filter((id) => !keepIds.includes(id));
    if (removeIds.length) await tx.ticketCategory.deleteMany({ where: { id: { in: removeIds } } });

    for (const [i, c] of input.ticketCategories.entries()) {
      if (c.id) {
        await tx.ticketCategory.update({
          where: { id: c.id },
          data: {
            name: c.name,
            description: c.description,
            price: c.price,
            totalQuantity: c.totalQuantity,
            minPerOrder: c.minPerOrder,
            maxPerOrder: c.maxPerOrder,
            refundEligible: c.refundEligible,
            benefits: c.benefits,
            position: i,
          },
        });
      } else {
        await tx.ticketCategory.create({
          data: {
            eventId,
            name: c.name,
            description: c.description,
            price: c.price,
            totalQuantity: c.totalQuantity,
            minPerOrder: c.minPerOrder,
            maxPerOrder: c.maxPerOrder,
            refundEligible: c.refundEligible,
            benefits: c.benefits,
            position: i,
          },
        });
      }
    }
  });

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "event.updated",
    entityType: "EVENT",
    entityId: eventId,
    description: `Updated event "${input.name}".`,
    previousValue: { name: before.name, capacity: before.capacity },
    newValue: { name: input.name, capacity: input.capacity },
  });

  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/edit`);
  return { ok: true as const };
}

async function setEventStatus(eventId: string, status: string, action: string, description: string) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  await prisma.event.update({ where: { id: eventId }, data: { status: status as never } });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action, entityType: "EVENT", entityId: eventId, description });
  revalidatePath("/admin/events");
  revalidatePath(`/admin/events/${eventId}/edit`);
  return { ok: true as const };
}

export async function publishEventAction(eventId: string) {
  return setEventStatus(eventId, "PUBLISHED", "event.published", "Event published.");
}
export async function unpublishEventAction(eventId: string) {
  return setEventStatus(eventId, "DRAFT", "event.unpublished", "Event unpublished back to draft.");
}
export async function pauseSalesAction(eventId: string) {
  return setEventStatus(eventId, "PAUSED", "event.sales_paused", "Ticket sales paused.");
}
export async function resumeSalesAction(eventId: string) {
  return setEventStatus(eventId, "PUBLISHED", "event.sales_resumed", "Ticket sales resumed.");
}
export async function archiveEventAction(eventId: string) {
  return setEventStatus(eventId, "ARCHIVED", "event.archived", "Event archived.");
}
export async function markCompletedAction(eventId: string) {
  return setEventStatus(eventId, "COMPLETED", "event.completed", "Event marked as completed.");
}

export async function cancelEventAction(eventId: string, reason: string) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  await prisma.$transaction(async (tx) => {
    await tx.event.update({ where: { id: eventId }, data: { status: "CANCELLED", cancelledAt: new Date(), cancelledReason: reason } });
    await tx.ticket.updateMany({ where: { eventId, status: { in: ["VALID"] } }, data: { status: "CANCELLED" } });
  });

  const bookings = await prisma.booking.findMany({ where: { eventId, status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] } } });
  for (const b of bookings) {
    await sendEmail({
      toEmail: b.buyerEmail,
      subject: `${event.name} has been cancelled`,
      bodyHtml: emailTemplates.eventCancelled({
        buyerName: b.buyerName,
        eventName: event.name,
        bookingNumber: b.bookingNumber,
        message: reason,
      }),
      previewText: "This event has been cancelled",
      category: "EVENT_CANCELLED",
      relatedBookingId: b.id,
      relatedEventId: eventId,
    });
  }

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "event.cancelled",
    entityType: "EVENT",
    entityId: eventId,
    description: `Event "${event.name}" cancelled. ${bookings.length} booking(s) notified.`,
    reason,
  });

  revalidatePath("/admin/events");
  return { ok: true as const, notifiedCount: bookings.length };
}

export async function rescheduleEventAction(eventId: string, input: { newStartAt: string; newEndAt: string; newVenueName?: string; note: string }) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const event = await prisma.event.findUniqueOrThrow({ where: { id: eventId } });

  await prisma.event.update({
    where: { id: eventId },
    data: {
      status: "RESCHEDULED",
      originalStartAt: event.originalStartAt ?? event.startAt,
      originalEndAt: event.originalEndAt ?? event.endAt,
      originalVenueName: event.originalVenueName ?? event.venueName,
      startAt: zonedInputToDate(input.newStartAt, event.timezone),
      endAt: zonedInputToDate(input.newEndAt, event.timezone),
      venueName: input.newVenueName || event.venueName,
      rescheduleNote: input.note,
    },
  });

  const bookings = await prisma.booking.findMany({ where: { eventId, status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] } } });
  const newDateStr = new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: event.timezone }).format(
    zonedInputToDate(input.newStartAt, event.timezone)
  );
  for (const b of bookings) {
    await sendEmail({
      toEmail: b.buyerEmail,
      subject: `Update: ${event.name} has been rescheduled`,
      bodyHtml: emailTemplates.eventRescheduled({
        buyerName: b.buyerName,
        eventName: event.name,
        bookingNumber: b.bookingNumber,
        newDate: newDateStr,
        changeSummary: input.note,
        bookingUrl: `${process.env.APP_URL}/account/bookings/${b.id}`,
      }),
      previewText: "Event date/venue update",
      category: "EVENT_RESCHEDULED",
      relatedBookingId: b.id,
      relatedEventId: eventId,
    });
  }

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "event.rescheduled",
    entityType: "EVENT",
    entityId: eventId,
    description: `Event "${event.name}" rescheduled. ${bookings.length} booking(s) notified.`,
    previousValue: { startAt: event.startAt, venueName: event.venueName },
    newValue: { startAt: input.newStartAt, venueName: input.newVenueName },
    reason: input.note,
  });

  revalidatePath("/admin/events");
  return { ok: true as const, notifiedCount: bookings.length };
}

export async function duplicateEventAction(eventId: string) {
  const session = await requireRole(["ADMIN", "EVENT_MANAGER"]);
  const original = await prisma.event.findUniqueOrThrow({
    where: { id: eventId },
    include: { images: true, faqs: true, questions: true, ticketCategories: true },
  });

  const baseSlug = `${original.slug}-copy`;
  let slug = baseSlug;
  let n = 1;
  while (await prisma.event.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${n++}`;
  }

  const copy = await prisma.event.create({
    data: {
      slug,
      name: `${original.name} (Copy)`,
      shortDescription: original.shortDescription,
      fullDescription: original.fullDescription,
      categoryId: original.categoryId,
      coverImage: original.coverImage,
      format: original.format,
      venueName: original.venueName,
      addressLine1: original.addressLine1,
      city: original.city,
      region: original.region,
      country: original.country,
      postalCode: original.postalCode,
      mapUrl: original.mapUrl,
      onlineUrl: original.onlineUrl,
      onlineInstructions: original.onlineInstructions,
      startAt: original.startAt,
      endAt: original.endAt,
      timezone: original.timezone,
      capacity: original.capacity,
      bookingStartAt: original.bookingStartAt,
      bookingEndAt: original.bookingEndAt,
      refundDeadlineHours: original.refundDeadlineHours,
      refundPolicy: original.refundPolicy,
      termsAndConditions: original.termsAndConditions,
      ageRestriction: original.ageRestriction,
      entryRequirements: original.entryRequirements,
      dressCode: original.dressCode,
      accessibilityInfo: original.accessibilityInfo,
      organizerName: original.organizerName,
      organizerEmail: original.organizerEmail,
      organizerPhone: original.organizerPhone,
      organizerBio: original.organizerBio,
      status: "DRAFT",
      visibility: original.visibility,
      waitlistEnabled: original.waitlistEnabled,
      createdById: session.userId,
      images: { create: original.images.map((i) => ({ url: i.url, altText: i.altText, position: i.position })) },
      faqs: { create: original.faqs.map((f) => ({ question: f.question, answer: f.answer, position: f.position })) },
      questions: { create: original.questions.map((q) => ({ label: q.label, type: q.type, options: q.options, required: q.required, position: q.position })) },
      ticketCategories: {
        create: original.ticketCategories.map((c) => ({
          name: c.name,
          description: c.description,
          price: c.price,
          totalQuantity: c.totalQuantity,
          minPerOrder: c.minPerOrder,
          maxPerOrder: c.maxPerOrder,
          refundEligible: c.refundEligible,
          benefits: c.benefits,
          position: c.position,
        })),
      },
    },
  });

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "event.duplicated",
    entityType: "EVENT",
    entityId: copy.id,
    description: `Duplicated "${original.name}" as "${copy.name}".`,
  });

  revalidatePath("/admin/events");
  return { ok: true as const, eventId: copy.id };
}

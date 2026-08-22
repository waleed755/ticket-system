import { prisma } from "./prisma";
import { releaseExpiredHolds } from "./inventory";
import { computeDisplayStatus, type DisplayStatus } from "./event-status";
import type { Prisma } from "@prisma/client";

export interface EventFilters {
  q?: string;
  category?: string;
  city?: string;
  format?: "PHYSICAL" | "ONLINE" | "HYBRID";
  priceType?: "FREE" | "PAID";
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  sort?: "date" | "recent" | "price_asc" | "price_desc" | "popularity" | "availability";
}

export async function listPublishedEvents(filters: EventFilters) {
  await releaseExpiredHolds();

  const where: Prisma.EventWhereInput = {
    status: { in: ["PUBLISHED", "PAUSED"] },
    visibility: "PUBLIC",
  };

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q } },
      { shortDescription: { contains: filters.q } },
      { city: { contains: filters.q } },
    ];
  }
  if (filters.category) where.category = { slug: filters.category };
  if (filters.city) where.city = { contains: filters.city };
  if (filters.format) where.format = filters.format;
  if (filters.dateFrom || filters.dateTo) {
    where.startAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo + "T23:59:59") } : {}),
    };
  }

  const events = await prisma.event.findMany({
    where,
    include: {
      category: true,
      ticketCategories: true,
      _count: { select: { tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } } } },
    },
    orderBy: filters.sort === "price_asc" || filters.sort === "price_desc" ? undefined : { startAt: "asc" },
  });

  let mapped = events.map((event) => {
    const visibleCategories = event.ticketCategories.filter((c) => c.visible);
    const lowestPrice = visibleCategories.length ? Math.min(...visibleCategories.map((c) => c.price)) : 0;
    const isFree = visibleCategories.length > 0 && visibleCategories.every((c) => c.price === 0);
    const capacityRemaining = Math.max(0, event.capacity - event._count.tickets);
    const displayStatus = computeDisplayStatus({
      status: event.status,
      bookingStartAt: event.bookingStartAt,
      bookingEndAt: event.bookingEndAt,
      endAt: event.endAt,
      capacityRemaining,
      capacity: event.capacity,
    });
    return { event, lowestPrice, isFree, capacityRemaining, displayStatus, ticketsSold: event._count.tickets };
  });

  if (filters.priceType === "FREE") mapped = mapped.filter((m) => m.isFree);
  if (filters.priceType === "PAID") mapped = mapped.filter((m) => !m.isFree);
  if (filters.minPrice !== undefined) mapped = mapped.filter((m) => m.lowestPrice >= filters.minPrice!);
  if (filters.maxPrice !== undefined) mapped = mapped.filter((m) => m.lowestPrice <= filters.maxPrice!);

  switch (filters.sort) {
    case "price_asc":
      mapped.sort((a, b) => a.lowestPrice - b.lowestPrice);
      break;
    case "price_desc":
      mapped.sort((a, b) => b.lowestPrice - a.lowestPrice);
      break;
    case "recent":
      mapped.sort((a, b) => b.event.createdAt.getTime() - a.event.createdAt.getTime());
      break;
    case "popularity":
      mapped.sort((a, b) => b.ticketsSold - a.ticketsSold);
      break;
    case "availability":
      mapped.sort((a, b) => b.capacityRemaining - a.capacityRemaining);
      break;
    default:
      mapped.sort((a, b) => a.event.startAt.getTime() - b.event.startAt.getTime());
  }

  return mapped;
}

export async function getEventDetail(slug: string, accessCode?: string) {
  await releaseExpiredHolds();
  const event = await prisma.event.findUnique({
    where: { slug },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      faqs: { orderBy: { position: "asc" } },
      questions: { orderBy: { position: "asc" } },
      ticketCategories: { orderBy: { position: "asc" } },
      _count: { select: { tickets: { where: { status: { in: ["VALID", "CHECKED_IN"] } } } } },
    },
  });

  if (!event) return null;
  if (event.status === "DRAFT" || event.status === "ARCHIVED") return null;

  if (event.visibility === "PRIVATE" && event.accessCode !== accessCode) {
    return { requiresAccessCode: true as const };
  }

  const capacityRemaining = Math.max(0, event.capacity - event._count.tickets);
  const displayStatus = computeDisplayStatus({
    status: event.status,
    bookingStartAt: event.bookingStartAt,
    bookingEndAt: event.bookingEndAt,
    endAt: event.endAt,
    capacityRemaining,
    capacity: event.capacity,
  });

  return { requiresAccessCode: false as const, event, capacityRemaining, displayStatus };
}

export async function getRelatedEvents(eventId: string, categoryId: string) {
  return prisma.event.findMany({
    where: { id: { not: eventId }, categoryId, status: { in: ["PUBLISHED", "PAUSED"] }, visibility: "PUBLIC" },
    include: { category: true, ticketCategories: true },
    take: 3,
  });
}

export type { DisplayStatus };

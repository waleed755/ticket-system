import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getScopedEventIds } from "@/lib/admin-scope";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scoped = await getScopedEventIds(session);

  const bookings = await prisma.booking.findMany({
    where: scoped === "ALL" ? {} : { eventId: { in: scoped } },
    include: { event: true, tickets: true },
    orderBy: { createdAt: "desc" },
  });

  const rows = bookings.map((b) => [
    b.bookingNumber,
    b.event.name,
    b.buyerName,
    b.buyerEmail,
    b.buyerPhone ?? "",
    String(b.tickets.length),
    (b.totalAmount / 100).toFixed(2),
    b.status,
    b.createdAt.toISOString(),
  ]);

  const csv = [["Booking Number", "Event", "Buyer Name", "Buyer Email", "Buyer Phone", "Tickets", "Total", "Status", "Created At"], ...rows]
    .map((r) => r.map((v) => csvEscape(v)).join(","))
    .join("\n");

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="bookings-export.csv"` } });
}

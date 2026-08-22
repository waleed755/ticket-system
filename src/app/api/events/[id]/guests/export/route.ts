import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tickets = await prisma.ticket.findMany({
    where: { eventId: id },
    include: { attendee: true, booking: true, ticketCategory: true, checkedInBy: true },
    orderBy: { createdAt: "asc" },
  });

  const headers = [
    "Attendee Name",
    "Buyer Name",
    "Email",
    "Phone",
    "Booking Number",
    "Ticket Number",
    "Ticket Category",
    "Price",
    "Payment Status",
    "Ticket Status",
    "Checked In At",
    "Checked In By",
  ];

  const rows = tickets.map((t) => [
    t.attendee.fullName,
    t.booking.buyerName,
    t.attendee.email ?? t.booking.buyerEmail,
    t.attendee.phone ?? t.booking.buyerPhone ?? "",
    t.booking.bookingNumber,
    t.ticketNumber,
    t.ticketCategory.name,
    (t.price / 100).toFixed(2),
    t.booking.status,
    t.status,
    t.checkedInAt ? t.checkedInAt.toISOString() : "",
    t.checkedInBy?.fullName ?? "",
  ]);

  const csv = [headers, ...rows].map((row) => row.map((v) => csvEscape(String(v))).join(",")).join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="guest-list-${event.slug}.csv"`,
    },
  });
}

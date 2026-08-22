import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getScopedEventIds } from "@/lib/admin-scope";

function csvEscape(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scoped = await getScopedEventIds(session);
  const eventFilter = scoped === "ALL" ? {} : { id: { in: scoped } };

  const events = await prisma.event.findMany({
    where: eventFilter,
    include: { tickets: true, _count: { select: { bookings: true } } },
  });

  const rows = events.map((e) => {
    const validTickets = e.tickets.filter((t) => ["VALID", "CHECKED_IN", "REFUNDED"].includes(t.status));
    const revenue = validTickets.reduce((s, t) => s + (t.status === "REFUNDED" ? 0 : t.price), 0);
    const checkedIn = e.tickets.filter((t) => t.status === "CHECKED_IN").length;
    return [e.name, e.status, String(e._count.bookings), String(validTickets.length), (revenue / 100).toFixed(2), String(checkedIn)];
  });

  const csv = [["Event", "Status", "Bookings", "Tickets Sold", "Revenue", "Checked In"], ...rows]
    .map((r) => r.map((v) => csvEscape(v)).join(","))
    .join("\n");

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="sales-report.csv"` } });
}

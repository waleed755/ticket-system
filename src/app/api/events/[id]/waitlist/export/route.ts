import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entries = await prisma.waitlistEntry.findMany({ where: { eventId: id }, include: { ticketCategory: true }, orderBy: { createdAt: "asc" } });
  const rows = [["Name", "Email", "Phone", "Category", "Status", "Joined At"], ...entries.map((e) => [e.name, e.email, e.phone ?? "", e.ticketCategory?.name ?? "Any", e.status, e.createdAt.toISOString()])];
  const csv = rows.map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(",")).join("\n");

  return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="waitlist-${event.slug}.csv"` } });
}

import { NextRequest, NextResponse } from "next/server";
import { generateTicketPdf } from "@/lib/ticket-pdf";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await generateTicketPdf(ticketId);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="ticket-${ticket.ticketNumber}.pdf"`,
    },
  });
}

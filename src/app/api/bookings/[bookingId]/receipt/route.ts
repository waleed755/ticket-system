import { NextRequest, NextResponse } from "next/server";
import { generateReceiptPdf } from "@/lib/ticket-pdf";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bytes = await generateReceiptPdf(bookingId);
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="receipt-${booking.bookingNumber}.pdf"`,
    },
  });
}

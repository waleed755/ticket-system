import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { formatMoney } from "./money";
import { formatEventDateTime } from "./format";

const PAGE_W = 612;
const PAGE_H = 300;

type TicketForPdf = Prisma.TicketGetPayload<{
  include: { attendee: true; event: true; ticketCategory: true; booking: true };
}>;

async function drawTicket(doc: PDFDocument, ticket: TicketForPdf) {
  const page = doc.addPage([PAGE_W, PAGE_H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: rgb(0.31, 0.27, 0.9) });
  page.drawText("GATHERLY", { x: 24, y: PAGE_H - 38, size: 16, font: bold, color: rgb(1, 1, 1) });
  page.drawText(ticket.status === "CHECKED_IN" ? "CHECKED IN" : ticket.status, {
    x: PAGE_W - 150,
    y: PAGE_H - 38,
    size: 12,
    font: bold,
    color: rgb(1, 1, 1),
  });

  let y = PAGE_H - 90;
  page.drawText(ticket.event.name, { x: 24, y, size: 18, font: bold, color: rgb(0.07, 0.09, 0.15) });
  y -= 22;
  page.drawText(formatEventDateTime(ticket.event.startAt, ticket.event.timezone), { x: 24, y, size: 11, font: regular, color: rgb(0.3, 0.3, 0.35) });
  y -= 16;
  const venueLine = ticket.event.format === "ONLINE" ? "Online event — access link sent by email" : `${ticket.event.venueName ?? ""}${ticket.event.city ? `, ${ticket.event.city}` : ""}`;
  page.drawText(venueLine, { x: 24, y, size: 11, font: regular, color: rgb(0.3, 0.3, 0.35) });

  y -= 34;
  page.drawText("ATTENDEE", { x: 24, y, size: 9, font: bold, color: rgb(0.5, 0.5, 0.55) });
  page.drawText("TICKET TYPE", { x: 220, y, size: 9, font: bold, color: rgb(0.5, 0.5, 0.55) });
  page.drawText("PRICE", { x: 380, y, size: 9, font: bold, color: rgb(0.5, 0.5, 0.55) });
  y -= 16;
  page.drawText(ticket.attendee.fullName, { x: 24, y, size: 13, font: bold, color: rgb(0.07, 0.09, 0.15) });
  page.drawText(ticket.ticketCategory.name, { x: 220, y, size: 13, font: regular, color: rgb(0.07, 0.09, 0.15) });
  page.drawText(formatMoney(ticket.price, ticket.booking.currency), { x: 380, y, size: 13, font: regular, color: rgb(0.07, 0.09, 0.15) });

  y -= 34;
  page.drawText(`Ticket #: ${ticket.ticketNumber}`, { x: 24, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.45) });
  y -= 14;
  page.drawText(`Booking #: ${ticket.booking.bookingNumber}`, { x: 24, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.45) });
  y -= 14;
  page.drawText(`Organizer: ${ticket.event.organizerName}`, { x: 24, y, size: 10, font: regular, color: rgb(0.4, 0.4, 0.45) });

  page.drawText("This ticket is uniquely coded and valid for one entry. Present the QR code at check-in.", {
    x: 24,
    y: 20,
    size: 8,
    font: regular,
    color: rgb(0.55, 0.55, 0.6),
  });

  // QR code
  const qrDataUrl = await QRCode.toBuffer(ticket.secureCode, { margin: 1, width: 180 });
  const qrImage = await doc.embedPng(qrDataUrl);
  page.drawImage(qrImage, { x: PAGE_W - 170, y: 40, width: 130, height: 130 });
  page.drawText(ticket.secureCode, { x: PAGE_W - 168, y: 30, size: 7, font: regular, color: rgb(0.4, 0.4, 0.45) });

  page.drawLine({
    start: { x: PAGE_W - 190, y: 10 },
    end: { x: PAGE_W - 190, y: PAGE_H - 70 },
    dashArray: [4, 4],
    color: rgb(0.85, 0.85, 0.88),
  });
}

export async function generateTicketPdf(ticketId: string): Promise<Uint8Array> {
  const ticket = await prisma.ticket.findUniqueOrThrow({
    where: { id: ticketId },
    include: { attendee: true, event: true, ticketCategory: true, booking: true },
  });
  const doc = await PDFDocument.create();
  await drawTicket(doc, ticket);
  return doc.save();
}

export async function generateBookingTicketsPdf(bookingId: string): Promise<Uint8Array> {
  const tickets = await prisma.ticket.findMany({
    where: { bookingId },
    include: { attendee: true, event: true, ticketCategory: true, booking: true },
    orderBy: { createdAt: "asc" },
  });
  const doc = await PDFDocument.create();
  for (const ticket of tickets) {
    await drawTicket(doc, ticket);
  }
  return doc.save();
}

export async function generateReceiptPdf(bookingId: string): Promise<Uint8Array> {
  const booking = await prisma.booking.findUniqueOrThrow({
    where: { id: bookingId },
    include: { event: true, payments: { where: { succeededAt: { not: null } } }, attendees: true },
  });
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  let y = 740;
  page.drawText("GATHERLY", { x: 48, y, size: 20, font: bold, color: rgb(0.31, 0.27, 0.9) });
  y -= 18;
  page.drawText("Payment Receipt", { x: 48, y, size: 12, font: regular, color: rgb(0.4, 0.4, 0.45) });

  y -= 40;
  page.drawText(`Booking Number: ${booking.bookingNumber}`, { x: 48, y, size: 11, font: regular });
  y -= 16;
  page.drawText(`Event: ${booking.event.name}`, { x: 48, y, size: 11, font: regular });
  y -= 16;
  page.drawText(`Buyer: ${booking.buyerName} (${booking.buyerEmail})`, { x: 48, y, size: 11, font: regular });
  y -= 16;
  const payment = booking.payments[0];
  if (payment) {
    page.drawText(`Payment reference: ${payment.reference}`, { x: 48, y, size: 11, font: regular });
    y -= 16;
    page.drawText(`Payment date: ${payment.succeededAt?.toDateString() ?? ""}`, { x: 48, y, size: 11, font: regular });
    y -= 16;
    page.drawText(`Method: ${payment.cardBrand ? `${payment.cardBrand} ending ${payment.cardLast4}` : "Free order"}`, { x: 48, y, size: 11, font: regular });
  }

  y -= 34;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, color: rgb(0.85, 0.85, 0.88) });
  y -= 24;
  const rows: [string, number][] = [
    ["Subtotal", booking.subtotal],
    ["Discount", -booking.discountAmount],
    ["Service fee", booking.feeAmount],
    ["Tax", booking.taxAmount],
  ];
  for (const [label, amount] of rows) {
    page.drawText(label, { x: 48, y, size: 11, font: regular });
    page.drawText(formatMoney(amount, booking.currency), { x: 470, y, size: 11, font: regular });
    y -= 18;
  }
  y -= 6;
  page.drawLine({ start: { x: 48, y }, end: { x: 564, y }, color: rgb(0.85, 0.85, 0.88) });
  y -= 20;
  page.drawText("Total paid", { x: 48, y, size: 13, font: bold });
  page.drawText(formatMoney(booking.totalAmount, booking.currency), { x: 460, y, size: 13, font: bold });

  return doc.save();
}

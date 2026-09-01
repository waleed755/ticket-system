"use server";

import { createBooking, confirmBookingPayment, loadBookingForPayment, BookingError, type AttendeeInput } from "@/lib/booking-engine";
import { validateDiscountCode } from "@/lib/discounts";
import { prisma } from "@/lib/prisma";
import { buildJazzCashPaymentRequest, isJazzCashConfigured } from "@/lib/jazzcash";
import { generateJazzCashTxnRefNo } from "@/lib/ids";

export async function createBookingAction(input: {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  attendees: AttendeeInput[];
  discountCode?: string;
  termsAccepted: boolean;
}) {
  try {
    const result = await createBooking(input);
    return { ok: true as const, bookingId: result.bookingId, totalAmount: result.totalAmount };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Something went wrong creating your booking. Please try again." };
  }
}

export async function checkDiscountCodeAction(input: {
  code: string;
  eventId: string;
  ticketCategoryIds: string[];
  buyerEmail: string;
  subtotal: number;
}) {
  return validateDiscountCode(input);
}

export async function confirmPaymentAction(input: {
  bookingId: string;
  card?: { cardNumber: string; expiry: string; cvc: string };
}) {
  return confirmBookingPayment(input);
}

export async function isJazzCashAvailableAction() {
  return isJazzCashConfigured();
}

export async function initiateJazzCashPaymentAction(bookingId: string) {
  const booking = await loadBookingForPayment(bookingId);
  if (!booking) return { ok: false as const, message: "Booking not found." };
  if (booking.status !== "PENDING_PAYMENT") {
    return { ok: false as const, message: "This booking is no longer available for payment." };
  }
  if (booking.reservationExpiresAt && booking.reservationExpiresAt < new Date()) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } });
    return { ok: false as const, message: "Your reserved tickets expired. Please start a new booking." };
  }
  if (booking.totalAmount <= 0) {
    return { ok: false as const, message: "This booking doesn't require payment." };
  }

  try {
    const txnRefNo = generateJazzCashTxnRefNo();

    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        amount: booking.totalAmount,
        currency: booking.currency,
        status: "PENDING",
        method: "jazzcash",
        reference: txnRefNo,
      },
    });

    const request = buildJazzCashPaymentRequest({
      amountPaisa: booking.totalAmount,
      billReference: booking.bookingNumber,
      description: `${booking.event.name} — ${booking.bookingNumber}`,
      txnRefNo,
    });

    return { ok: true as const, ...request };
  } catch (err) {
    console.error(err);
    return { ok: false as const, message: err instanceof Error ? err.message : "JazzCash is not available right now." };
  }
}

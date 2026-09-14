"use server";

import { createBooking, confirmFreeBooking, submitPaymentProof, BookingError, type AttendeeInput } from "@/lib/booking-engine";
import { validateDiscountCode } from "@/lib/discounts";

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

export async function confirmFreeBookingAction(bookingId: string) {
  return confirmFreeBooking(bookingId);
}

export async function submitPaymentProofAction(input: { bookingId: string; proofImageUrl: string }) {
  return submitPaymentProof(input);
}

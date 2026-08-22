import { prisma } from "./prisma";
import { generateBookingNumber, generateTicketNumber, generateSecureTicketCode, generatePaymentReference, generateToken } from "./ids";
import { RESERVATION_HOLD_MINUTES, releaseExpiredHolds } from "./inventory";
import { validateDiscountCode } from "./discounts";
import { simulateCharge, simulateRefund } from "./payments";
import { sendEmail, emailTemplates } from "./email";
import { logActivity } from "./activity";
import { formatMoney } from "./money";

export interface AttendeeInput {
  ticketCategoryId: string;
  fullName: string;
  email?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  idNumber?: string;
  emergencyContact?: string;
  accessibilityNeeds?: string;
  dietaryNeeds?: string;
  customAnswers?: Record<string, string>;
  isBuyer?: boolean;
}

export class BookingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BookingError";
  }
}

const SERVICE_FEE_PERCENT = 3; // percent
const SERVICE_FEE_FLAT = 10000; // paisa (PKR 100.00)

function computeServiceFee(subtotal: number): number {
  if (subtotal <= 0) return 0;
  return Math.round((subtotal * SERVICE_FEE_PERCENT) / 100) + SERVICE_FEE_FLAT;
}

export async function createBooking(params: {
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  attendees: AttendeeInput[];
  discountCode?: string;
  termsAccepted: boolean;
}) {
  const { eventId, buyerName, buyerEmail, buyerPhone, attendees, discountCode, termsAccepted } = params;

  if (!termsAccepted) throw new BookingError("You must accept the event terms and refund policy to continue.");
  if (attendees.length === 0) throw new BookingError("Add at least one attendee.");

  await releaseExpiredHolds(eventId);

  return prisma.$transaction(async (tx) => {
    const event = await tx.event.findUniqueOrThrow({ where: { id: eventId }, include: { ticketCategories: true } });

    const now = new Date();
    if (event.status !== "PUBLISHED" && event.status !== "PAUSED") {
      throw new BookingError("This event is not currently open for booking.");
    }
    if (now < event.bookingStartAt) throw new BookingError("Booking has not opened yet for this event.");
    if (now > event.bookingEndAt) throw new BookingError("Booking is closed for this event.");

    // Group attendees by category to validate quantities.
    const byCategory = new Map<string, AttendeeInput[]>();
    for (const a of attendees) {
      const list = byCategory.get(a.ticketCategoryId) ?? [];
      list.push(a);
      byCategory.set(a.ticketCategoryId, list);
    }

    let subtotal = 0;
    const categorySnapshots: { id: string; price: number; qty: number }[] = [];

    for (const [categoryId, list] of byCategory) {
      const category = event.ticketCategories.find((c) => c.id === categoryId);
      if (!category) throw new BookingError("Selected ticket category is not available for this event.");
      if (category.status !== "ACTIVE") throw new BookingError(`"${category.name}" is not currently on sale.`);
      if (category.saleStartAt && now < category.saleStartAt) throw new BookingError(`"${category.name}" sales have not started yet.`);
      if (category.saleEndAt && now > category.saleEndAt) throw new BookingError(`"${category.name}" sales have closed.`);

      const qty = list.length;
      if (qty < category.minPerOrder) throw new BookingError(`Minimum ${category.minPerOrder} ticket(s) required for "${category.name}".`);
      if (qty > category.maxPerOrder) throw new BookingError(`Maximum ${category.maxPerOrder} ticket(s) allowed per order for "${category.name}".`);

      const held = await tx.attendee.count({
        where: { ticketCategoryId: categoryId, booking: { status: "PENDING_PAYMENT", reservationExpiresAt: { gt: now } } },
      });
      const remaining = category.totalQuantity - category.quantitySold - held;
      if (qty > remaining) {
        throw new BookingError(
          remaining <= 0 ? `"${category.name}" is sold out.` : `Only ${remaining} ticket(s) remaining for "${category.name}".`
        );
      }

      subtotal += category.price * qty;
      categorySnapshots.push({ id: categoryId, price: category.price, qty });
    }

    // Event-level capacity check.
    const confirmedTickets = await tx.ticket.count({ where: { eventId, status: { in: ["VALID", "CHECKED_IN"] } } });
    const heldTotal = await tx.attendee.count({
      where: { booking: { eventId, status: "PENDING_PAYMENT", reservationExpiresAt: { gt: now } } },
    });
    if (confirmedTickets + heldTotal + attendees.length > event.capacity) {
      throw new BookingError("This event has reached full capacity.");
    }

    let discountAmount = 0;
    let discountId: string | undefined;
    if (discountCode) {
      const result = await validateDiscountCode({
        code: discountCode,
        eventId,
        ticketCategoryIds: [...byCategory.keys()],
        buyerEmail,
        subtotal,
      });
      if (!result.valid) throw new BookingError(result.reason || "Invalid discount code.");
      discountAmount = result.discountAmount!;
      discountId = result.discountId;
    }

    const feeAmount = computeServiceFee(subtotal - discountAmount);
    const totalAmount = Math.max(0, subtotal - discountAmount + feeAmount);

    const booking = await tx.booking.create({
      data: {
        bookingNumber: generateBookingNumber(),
        eventId,
        buyerName,
        buyerEmail: buyerEmail.toLowerCase(),
        buyerPhone,
        status: "PENDING_PAYMENT",
        reservationExpiresAt: new Date(now.getTime() + RESERVATION_HOLD_MINUTES * 60 * 1000),
        subtotal,
        discountAmount,
        feeAmount,
        taxAmount: 0,
        totalAmount,
        currency: event.ticketCategories[0]?.currency ?? "PKR",
        discountCodeId: discountId,
        termsAcceptedAt: now,
        attendees: {
          create: attendees.map((a) => ({
            ticketCategoryId: a.ticketCategoryId,
            fullName: a.fullName,
            email: a.email,
            phone: a.phone,
            dateOfBirth: a.dateOfBirth ? new Date(a.dateOfBirth) : null,
            gender: a.gender,
            idNumber: a.idNumber,
            emergencyContact: a.emergencyContact,
            accessibilityNeeds: a.accessibilityNeeds,
            dietaryNeeds: a.dietaryNeeds,
            customAnswers: a.customAnswers ? JSON.stringify(a.customAnswers) : null,
            isBuyer: a.isBuyer ?? false,
          })),
        },
      },
    });

    return { bookingId: booking.id, totalAmount, currency: booking.currency };
  });
}

export type PaymentAttemptResult =
  | { success: true; bookingId: string }
  | { success: false; reason: string; alreadyConfirmed?: boolean };

export async function confirmBookingPayment(params: {
  bookingId: string;
  card?: { cardNumber: string; expiry: string; cvc: string };
}): Promise<PaymentAttemptResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: params.bookingId },
    include: { event: true, attendees: true },
  });
  if (!booking) return { success: false, reason: "Booking not found." };

  if (booking.status === "CONFIRMED" || booking.status === "COMPLETED") {
    return { success: true, bookingId: booking.id };
  }
  if (booking.status !== "PENDING_PAYMENT") {
    return { success: false, reason: "This booking is no longer available for payment." };
  }
  if (booking.reservationExpiresAt && booking.reservationExpiresAt < new Date()) {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "EXPIRED" } });
    return { success: false, reason: "Your reserved tickets expired. Please start a new booking." };
  }

  const isFree = booking.totalAmount === 0;
  let chargeSuccess = true;
  let reference = generatePaymentReference();
  let cardLast4 = "";
  let cardBrand = "";
  let failureReason: string | undefined;

  if (!isFree) {
    if (!params.card) return { success: false, reason: "Payment details are required." };
    const result = simulateCharge(params.card);
    chargeSuccess = result.success;
    reference = result.reference;
    cardLast4 = result.cardLast4;
    cardBrand = result.cardBrand;
    failureReason = result.failureReason;
  }

  const payment = await prisma.payment.create({
    data: {
      bookingId: booking.id,
      amount: booking.totalAmount,
      currency: booking.currency,
      status: chargeSuccess ? "SUCCEEDED" : "FAILED",
      method: isFree ? "free" : "test_card",
      reference,
      cardLast4: cardLast4 || null,
      cardBrand: cardBrand || null,
      failureReason: failureReason,
      succeededAt: chargeSuccess ? new Date() : null,
    },
  });

  if (!chargeSuccess) {
    await sendEmail({
      toEmail: booking.buyerEmail,
      subject: `Payment issue for ${booking.event.name}`,
      bodyHtml: emailTemplates.paymentFailed({
        buyerName: booking.buyerName,
        eventName: booking.event.name,
        retryUrl: `${process.env.APP_URL}/checkout/${booking.id}/pay`,
        reason: failureReason || "Payment could not be processed.",
      }),
      previewText: "Your payment could not be processed",
      category: "PAYMENT_FAILED",
      relatedBookingId: booking.id,
      relatedEventId: booking.eventId,
    });
    return { success: false, reason: failureReason || "Payment failed." };
  }

  // Success path: generate tickets, update inventory, create/link account, notify.
  await prisma.$transaction(async (tx) => {
    for (const attendee of booking.attendees) {
      await tx.ticket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          secureCode: generateSecureTicketCode(),
          bookingId: booking.id,
          attendeeId: attendee.id,
          eventId: booking.eventId,
          ticketCategoryId: attendee.ticketCategoryId,
          status: "VALID",
          price: (await tx.ticketCategory.findUniqueOrThrow({ where: { id: attendee.ticketCategoryId } })).price,
        },
      });
      await tx.ticketCategory.update({
        where: { id: attendee.ticketCategoryId },
        data: { quantitySold: { increment: 1 } },
      });
    }

    // Flip any category that just sold out.
    const categories = await tx.ticketCategory.findMany({ where: { eventId: booking.eventId } });
    for (const c of categories) {
      if (c.status === "ACTIVE" && c.quantitySold >= c.totalQuantity) {
        await tx.ticketCategory.update({ where: { id: c.id }, data: { status: "SOLD_OUT" } });
      }
    }

    await tx.booking.update({ where: { id: booking.id }, data: { status: "CONFIRMED" } });

    if (booking.discountCodeId) {
      await tx.discountCode.update({ where: { id: booking.discountCodeId }, data: { usedCount: { increment: 1 } } });
      await tx.discountRedemption.create({
        data: {
          discountCodeId: booking.discountCodeId,
          bookingId: booking.id,
          customerEmail: booking.buyerEmail,
          amount: booking.discountAmount,
        },
      });
    }
  });

  // Account resolution (outside main transaction — email/token generation not required to be atomic with inventory).
  let user = await prisma.user.findUnique({ where: { email: booking.buyerEmail } });
  let isNewAccount = false;
  if (!user) {
    isNewAccount = true;
    const activationToken = generateToken();
    user = await prisma.user.create({
      data: {
        email: booking.buyerEmail,
        role: "CUSTOMER",
        status: "PENDING_ACTIVATION",
        fullName: booking.buyerName,
        phone: booking.buyerPhone,
        activationToken,
        activationTokenExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  await prisma.booking.update({ where: { id: booking.id }, data: { customerId: user.id } });

  const eventDateStr = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: booking.event.timezone,
  }).format(booking.event.startAt);

  await sendEmail({
    toEmail: booking.buyerEmail,
    toUserId: user.id,
    subject: `Your booking is confirmed — ${booking.event.name}`,
    bodyHtml: emailTemplates.bookingConfirmation({
      buyerName: booking.buyerName,
      eventName: booking.event.name,
      bookingNumber: booking.bookingNumber,
      eventDate: eventDateStr,
      venue: booking.event.format === "ONLINE" ? "Online event" : booking.event.venueName || "",
      ticketCount: booking.attendees.length,
      total: formatMoney(booking.totalAmount, booking.currency),
      bookingUrl: `${process.env.APP_URL}/account/bookings/${booking.id}`,
    }),
    previewText: "Your tickets are ready",
    category: "BOOKING_CONFIRMATION",
    relatedBookingId: booking.id,
    relatedEventId: booking.eventId,
  });

  if (!isFree) {
    await sendEmail({
      toEmail: booking.buyerEmail,
      toUserId: user.id,
      subject: `Payment receipt — ${booking.bookingNumber}`,
      bodyHtml: emailTemplates.paymentReceipt({
        buyerName: booking.buyerName,
        bookingNumber: booking.bookingNumber,
        paymentReference: payment.reference,
        amount: formatMoney(booking.totalAmount, booking.currency),
        date: new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date()),
        receiptUrl: `${process.env.APP_URL}/account/bookings/${booking.id}/receipt`,
      }),
      previewText: "Payment receipt",
      category: "PAYMENT_RECEIPT",
      relatedBookingId: booking.id,
      relatedEventId: booking.eventId,
    });
  }

  if (isNewAccount) {
    await sendEmail({
      toEmail: booking.buyerEmail,
      toUserId: user.id,
      subject: "Activate your account",
      bodyHtml: emailTemplates.accountCreated({
        buyerName: booking.buyerName,
        activationUrl: `${process.env.APP_URL}/activate/${user.activationToken}`,
      }),
      previewText: "Set your password to access your bookings any time",
      category: "ACCOUNT_ACTIVATION",
      relatedBookingId: booking.id,
    });
  }

  await logActivity({
    actorId: null,
    actorName: "System",
    action: "booking.confirmed",
    entityType: "BOOKING",
    entityId: booking.id,
    description: `Booking ${booking.bookingNumber} confirmed for ${booking.event.name} (${booking.attendees.length} ticket(s)).`,
  });

  return { success: true, bookingId: booking.id };
}

export async function refundSimulatedPayment(paymentReference: string, amount: number) {
  return simulateRefund(paymentReference, amount);
}

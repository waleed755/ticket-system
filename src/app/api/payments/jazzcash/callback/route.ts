import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyJazzCashCallback } from "@/lib/jazzcash";
import { finalizeConfirmedPayment, sendPaymentFailedNotice, loadBookingForPayment } from "@/lib/booking-engine";
import { logActivity } from "@/lib/activity";

const APP_URL = process.env.APP_URL || "http://localhost:3000";

// JazzCash redirects the customer's browser back here via a POST after they
// complete (or abandon) payment on JazzCash's hosted page. This must verify
// the secure hash before trusting anything in the payload — the request
// arrives through the customer's browser, not a trusted server-to-server
// channel.
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const fields: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    fields[key] = String(value);
  }

  const txnRefNo = fields.pp_TxnRefNo;
  if (!txnRefNo) {
    return NextResponse.redirect(`${APP_URL}/?error=jazzcash_invalid_response`, { status: 303 });
  }

  const payment = await prisma.payment.findUnique({ where: { reference: txnRefNo } });
  if (!payment) {
    return NextResponse.redirect(`${APP_URL}/?error=jazzcash_unknown_transaction`, { status: 303 });
  }

  // Idempotency: JazzCash or the customer's browser may deliver this more
  // than once. Never re-issue tickets or re-send confirmation email.
  if (payment.status === "SUCCEEDED") {
    return NextResponse.redirect(`${APP_URL}/checkout/${payment.bookingId}/confirmation`, { status: 303 });
  }

  const result = verifyJazzCashCallback(fields);

  if (!result.hashValid) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: "Security verification failed on JazzCash callback.", providerResponse: JSON.stringify(fields) },
    });
    await logActivity({
      actorId: null,
      actorName: "System",
      action: "payment.jazzcash_hash_mismatch",
      entityType: "PAYMENT",
      entityId: payment.id,
      description: `JazzCash callback for transaction ${txnRefNo} failed secure hash verification and was rejected.`,
    });
    return NextResponse.redirect(`${APP_URL}/checkout/${payment.bookingId}/pay?error=jazzcash_verification_failed`, { status: 303 });
  }

  const booking = await loadBookingForPayment(payment.bookingId);
  if (!booking) {
    return NextResponse.redirect(`${APP_URL}/?error=jazzcash_booking_missing`, { status: 303 });
  }

  if (result.success) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "SUCCEEDED",
        succeededAt: new Date(),
        providerResponse: JSON.stringify(fields),
      },
    });

    if (booking.status === "PENDING_PAYMENT") {
      await finalizeConfirmedPayment(booking, payment);
    }

    return NextResponse.redirect(`${APP_URL}/checkout/${booking.id}/confirmation`, { status: 303 });
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: { status: "FAILED", failureReason: result.responseMessage, providerResponse: JSON.stringify(fields) },
  });
  await sendPaymentFailedNotice(booking, result.responseMessage);

  return NextResponse.redirect(`${APP_URL}/checkout/${booking.id}/pay?error=jazzcash_declined`, { status: 303 });
}

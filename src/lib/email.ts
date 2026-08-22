import { prisma } from "./prisma";
import type { EmailCategory } from "@prisma/client";

// Simulated email provider: renders real branded HTML and stores it to the
// EmailLog table (visible in the admin "Communications" log and, for
// account-related mail, surfaced directly in the customer dashboard) instead
// of dispatching through a live SMTP/ESP account. Swap the body of `sendEmail`
// for a real provider call (Resend/SendGrid/SES) to go live — every call site
// in the app stays the same.

const APP_NAME = process.env.APP_NAME || "Gatherly";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function layout(title: string, bodyHtml: string, previewText = ""): string {
  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;max-height:0;overflow:hidden;">${previewText}</span>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
        <tr><td style="background:#111827;padding:24px 32px;">
          <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.02em;">${APP_NAME}</span>
        </td></tr>
        <tr><td style="padding:32px;color:#111827;font-size:15px;line-height:1.6;">
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:20px 32px;background:#f9fafb;color:#6b7280;font-size:12px;border-top:1px solid #eef0f3;">
          © ${new Date().getFullYear()} ${APP_NAME}. This is an automated message. If you did not expect this email, please contact
          <a href="${APP_URL}/contact" style="color:#4f46e5;">support</a>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;margin:16px 0;">${label}</a>`;
}

export async function sendEmail(params: {
  toEmail: string;
  toUserId?: string;
  subject: string;
  bodyHtml: string;
  previewText?: string;
  category: EmailCategory;
  relatedBookingId?: string;
  relatedEventId?: string;
}) {
  const html = layout(params.subject, params.bodyHtml, params.previewText);
  await prisma.emailLog.create({
    data: {
      toEmail: params.toEmail,
      toUserId: params.toUserId,
      subject: params.subject,
      bodyHtml: html,
      category: params.category,
      relatedBookingId: params.relatedBookingId,
      relatedEventId: params.relatedEventId,
    },
  });
}

export const emailTemplates = {
  bookingConfirmation: (opts: {
    buyerName: string;
    eventName: string;
    bookingNumber: string;
    eventDate: string;
    venue: string;
    ticketCount: number;
    total: string;
    bookingUrl: string;
  }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>Your booking for <strong>${opts.eventName}</strong> is confirmed.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;">Booking number</td><td style="padding:6px 0;text-align:right;font-weight:600;">${opts.bookingNumber}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Event date</td><td style="padding:6px 0;text-align:right;">${opts.eventDate}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Venue</td><td style="padding:6px 0;text-align:right;">${opts.venue}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Tickets</td><td style="padding:6px 0;text-align:right;">${opts.ticketCount}</td></tr>
      <tr><td style="padding:8px 0;color:#111827;font-weight:700;border-top:1px solid #eef0f3;">Total paid</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #eef0f3;">${opts.total}</td></tr>
    </table>
    <p>Your tickets are attached to your booking and ready to download.</p>
    ${button("View booking & tickets", opts.bookingUrl)}
  `,
  accountCreated: (opts: { buyerName: string; activationUrl: string }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>We've created an account for you using the email address from your recent booking. With an account you can:</p>
    <ul style="padding-left:20px;color:#374151;">
      <li>View all your bookings and tickets in one place</li>
      <li>Download receipts and re-send tickets any time</li>
      <li>Track refund requests</li>
      <li>Get event updates and reminders</li>
    </ul>
    <p>Set a password to activate your account:</p>
    ${button("Activate my account", opts.activationUrl)}
    <p style="color:#6b7280;font-size:13px;">This link is valid for 7 days. Your booking is already confirmed and does not require account activation.</p>
  `,
  passwordReset: (opts: { fullName: string; resetUrl: string }) => `
    <p>Hi ${opts.fullName},</p>
    <p>We received a request to reset your password. Click below to choose a new one.</p>
    ${button("Reset password", opts.resetUrl)}
    <p style="color:#6b7280;font-size:13px;">If you didn't request this, you can safely ignore this email. This link expires in 60 minutes.</p>
  `,
  paymentReceipt: (opts: {
    buyerName: string;
    bookingNumber: string;
    paymentReference: string;
    amount: string;
    date: string;
    receiptUrl: string;
  }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>This confirms your payment for booking <strong>${opts.bookingNumber}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px;">
      <tr><td style="padding:6px 0;color:#6b7280;">Payment reference</td><td style="padding:6px 0;text-align:right;">${opts.paymentReference}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;">Date</td><td style="padding:6px 0;text-align:right;">${opts.date}</td></tr>
      <tr><td style="padding:8px 0;font-weight:700;border-top:1px solid #eef0f3;">Amount charged</td><td style="padding:8px 0;text-align:right;font-weight:700;border-top:1px solid #eef0f3;">${opts.amount}</td></tr>
    </table>
    ${button("Download receipt", opts.receiptUrl)}
  `,
  paymentFailed: (opts: { buyerName: string; eventName: string; retryUrl: string; reason: string }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>We couldn't process your payment for <strong>${opts.eventName}</strong>.</p>
    <p style="color:#b91c1c;background:#fef2f2;padding:10px 14px;border-radius:8px;">${opts.reason}</p>
    <p>Your selected tickets are being held for a short time. You can retry payment now:</p>
    ${button("Retry payment", opts.retryUrl)}
  `,
  refundRequested: (opts: { buyerName: string; bookingNumber: string; amount: string }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>We've received your refund request for booking <strong>${opts.bookingNumber}</strong> (requested amount: ${opts.amount}). Our team will review it and respond shortly.</p>
  `,
  refundDecision: (opts: {
    buyerName: string;
    bookingNumber: string;
    status: "APPROVED" | "PARTIALLY_APPROVED" | "REJECTED" | "COMPLETED";
    amount: string;
    message?: string;
  }) => {
    const statusText: Record<string, string> = {
      APPROVED: "approved",
      PARTIALLY_APPROVED: "partially approved",
      REJECTED: "not approved",
      COMPLETED: "completed and refunded to your original payment method",
    };
    return `
    <p>Hi ${opts.buyerName},</p>
    <p>Your refund request for booking <strong>${opts.bookingNumber}</strong> has been ${statusText[opts.status]}.</p>
    ${opts.status !== "REJECTED" ? `<p><strong>Amount: ${opts.amount}</strong></p>` : ""}
    ${opts.message ? `<p style="color:#374151;background:#f9fafb;padding:10px 14px;border-radius:8px;">${opts.message}</p>` : ""}
  `;
  },
  eventCancelled: (opts: { buyerName: string; eventName: string; bookingNumber: string; message: string }) => `
    <p>Hi ${opts.buyerName},</p>
    <p style="color:#b91c1c;font-weight:600;">${opts.eventName} has been cancelled.</p>
    <p>${opts.message}</p>
    <p>Your booking (${opts.bookingNumber}) and all associated tickets have been invalidated. Refund details will follow separately.</p>
  `,
  eventRescheduled: (opts: {
    buyerName: string;
    eventName: string;
    bookingNumber: string;
    newDate: string;
    changeSummary: string;
    bookingUrl: string;
  }) => `
    <p>Hi ${opts.buyerName},</p>
    <p><strong>${opts.eventName}</strong> has been updated.</p>
    <p style="background:#fffbeb;color:#92400e;padding:10px 14px;border-radius:8px;">${opts.changeSummary}</p>
    <p>New date/time: <strong>${opts.newDate}</strong></p>
    <p>Your tickets remain valid for booking ${opts.bookingNumber}. If you can no longer attend, a refund exception may be available.</p>
    ${button("View updated booking", opts.bookingUrl)}
  `,
  reminder: (opts: {
    buyerName: string;
    eventName: string;
    date: string;
    venue: string;
    directions: string;
    bookingUrl: string;
    label: string;
  }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>Reminder — <strong>${opts.eventName}</strong> is coming up (${opts.label}).</p>
    <p><strong>${opts.date}</strong><br/>${opts.venue}</p>
    <p style="color:#6b7280;">${opts.directions}</p>
    ${button("Access your tickets", opts.bookingUrl)}
  `,
  announcement: (opts: { buyerName: string; eventName: string; message: string }) => `
    <p>Hi ${opts.buyerName},</p>
    <p>An update about <strong>${opts.eventName}</strong>:</p>
    <div style="padding:12px 16px;background:#f9fafb;border-radius:8px;">${opts.message}</div>
  `,
  waitlistConfirmation: (opts: { name: string; eventName: string }) => `
    <p>Hi ${opts.name},</p>
    <p>You've been added to the waiting list for <strong>${opts.eventName}</strong>. We'll email you the moment tickets become available.</p>
  `,
  waitlistAvailable: (opts: { name: string; eventName: string; bookingUrl: string }) => `
    <p>Hi ${opts.name},</p>
    <p>Good news — tickets for <strong>${opts.eventName}</strong> are available again.</p>
    ${button("Book now", opts.bookingUrl)}
    <p style="color:#6b7280;font-size:13px;">Tickets are limited and offered on a first-come basis.</p>
  `,
};

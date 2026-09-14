export const bookingStatusColor: Record<string, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  PENDING_PAYMENT: "amber",
  PAYMENT_VERIFICATION_PENDING: "amber",
  CONFIRMED: "green",
  PARTIALLY_REFUNDED: "purple",
  FULLY_REFUNDED: "red",
  CANCELLED: "red",
  EXPIRED: "gray",
  COMPLETED: "blue",
};

export const ticketStatusColor: Record<string, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  VALID: "green",
  CHECKED_IN: "blue",
  CANCELLED: "red",
  REFUNDED: "purple",
  EXPIRED: "gray",
  INVALID: "red",
  TRANSFERRED: "indigo",
};

export const refundStatusColor: Record<string, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  PENDING: "amber",
  APPROVED: "blue",
  PARTIALLY_APPROVED: "purple",
  REJECTED: "red",
  COMPLETED: "green",
};

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  free: "Free order",
  manual_transfer: "Bank transfer / QR",
  complimentary: "Complimentary",
  manual: "Manual (staff-entered)",
};

// cardBrand/cardLast4 are only ever set by the (removed) card-charging flow —
// kept on the Payment model for historical bookings. Any payment without
// them is either free or manually verified, never "Free order" by default.
export function paymentMethodLabel(payment: { method: string; cardBrand: string | null; cardLast4: string | null }): string {
  if (payment.cardBrand) return `${payment.cardBrand} •••• ${payment.cardLast4}`;
  return PAYMENT_METHOD_LABELS[payment.method] ?? payment.method;
}

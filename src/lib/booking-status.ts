export const bookingStatusColor: Record<string, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  PENDING_PAYMENT: "amber",
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

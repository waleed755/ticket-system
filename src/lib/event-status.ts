export type DisplayStatus =
  | "COMING_SOON"
  | "BOOKING_OPEN"
  | "ALMOST_SOLD_OUT"
  | "SOLD_OUT"
  | "BOOKING_CLOSED"
  | "POSTPONED"
  | "RESCHEDULED"
  | "CANCELLED"
  | "COMPLETED";

export const displayStatusLabels: Record<DisplayStatus, string> = {
  COMING_SOON: "Coming soon",
  BOOKING_OPEN: "Booking open",
  ALMOST_SOLD_OUT: "Almost sold out",
  SOLD_OUT: "Sold out",
  BOOKING_CLOSED: "Booking closed",
  POSTPONED: "Postponed",
  RESCHEDULED: "Rescheduled",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const displayStatusColor: Record<DisplayStatus, "gray" | "green" | "red" | "amber" | "blue" | "purple" | "indigo"> = {
  COMING_SOON: "blue",
  BOOKING_OPEN: "green",
  ALMOST_SOLD_OUT: "amber",
  SOLD_OUT: "red",
  BOOKING_CLOSED: "gray",
  POSTPONED: "amber",
  RESCHEDULED: "purple",
  CANCELLED: "red",
  COMPLETED: "gray",
};

export function computeDisplayStatus(params: {
  status: string;
  bookingStartAt: Date;
  bookingEndAt: Date;
  endAt: Date;
  capacityRemaining: number;
  capacity: number;
  now?: Date;
}): DisplayStatus {
  const now = params.now ?? new Date();

  if (params.status === "CANCELLED") return "CANCELLED";
  if (params.status === "POSTPONED") return "POSTPONED";
  if (params.status === "RESCHEDULED") return "RESCHEDULED";
  if (params.status === "COMPLETED" || now > params.endAt) return "COMPLETED";
  if (params.status === "ARCHIVED") return "COMPLETED";

  if (now < params.bookingStartAt) return "COMING_SOON";
  if (params.status === "PAUSED" || now > params.bookingEndAt) return "BOOKING_CLOSED";

  if (params.capacityRemaining <= 0) return "SOLD_OUT";
  if (params.capacityRemaining <= Math.max(5, Math.round(params.capacity * 0.05))) return "ALMOST_SOLD_OUT";

  return "BOOKING_OPEN";
}

export function isBookable(displayStatus: DisplayStatus): boolean {
  return displayStatus === "BOOKING_OPEN" || displayStatus === "ALMOST_SOLD_OUT";
}

import type { Role } from "@prisma/client";

export const ADMIN_ROLES: Role[] = ["ADMIN", "EVENT_MANAGER", "BOOKING_MANAGER", "FINANCE_MANAGER", "SUPPORT"];

export interface Permissions {
  events: "full" | "assigned" | "view" | "none";
  bookings: "full" | "assigned" | "view" | "none";
  payments: "full" | "view" | "none";
  refunds: "full" | "view" | "none";
  discounts: "full" | "none";
  staff: "full" | "none";
  reports: "full" | "assigned" | "none";
  settings: "full" | "none";
}

export function getPermissions(role: Role): Permissions {
  switch (role) {
    case "ADMIN":
      return { events: "full", bookings: "full", payments: "full", refunds: "full", discounts: "full", staff: "full", reports: "full", settings: "full" };
    case "EVENT_MANAGER":
      return { events: "assigned", bookings: "assigned", payments: "none", refunds: "none", discounts: "none", staff: "none", reports: "assigned", settings: "none" };
    case "BOOKING_MANAGER":
      return { events: "view", bookings: "full", payments: "view", refunds: "view", discounts: "none", staff: "none", reports: "full", settings: "none" };
    case "FINANCE_MANAGER":
      return { events: "view", bookings: "view", payments: "full", refunds: "full", discounts: "full", staff: "none", reports: "full", settings: "none" };
    case "SUPPORT":
      return { events: "view", bookings: "full", payments: "view", refunds: "view", discounts: "none", staff: "none", reports: "none", settings: "none" };
    default:
      return { events: "none", bookings: "none", payments: "none", refunds: "none", discounts: "none", staff: "none", reports: "none", settings: "none" };
  }
}

export const roleLabels: Record<Role, string> = {
  ADMIN: "Administrator",
  EVENT_MANAGER: "Event Manager",
  BOOKING_MANAGER: "Booking Manager",
  FINANCE_MANAGER: "Finance & Refund Manager",
  SUPPORT: "Customer Support",
  CHECKIN_STAFF: "Check-in Staff",
  CUSTOMER: "Customer",
};

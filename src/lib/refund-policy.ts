// Server-side, single-source-of-truth refund eligibility engine.
// Never trust a client-computed "eligible" flag — always recompute here.

export type RefundIneligibleCode =
  | "WINDOW_CLOSED"
  | "EVENT_STARTED"
  | "EVENT_ENDED"
  | "CHECKED_IN"
  | "ALREADY_REFUNDED"
  | "CANCELLED_TICKET"
  | "CATEGORY_NOT_ELIGIBLE"
  | "EVENT_CANCELLED_USE_CANCELLATION_FLOW";

export interface RefundEligibility {
  eligible: boolean;
  deadline: Date;
  reasonCode?: RefundIneligibleCode;
  reasonMessage?: string;
}

const STANDARD_MESSAGE =
  "This ticket is no longer eligible for a refund because refund requests close 48 hours before the event begins.";

export function computeRefundDeadline(eventStartAt: Date, refundDeadlineHours: number): Date {
  return new Date(eventStartAt.getTime() - refundDeadlineHours * 60 * 60 * 1000);
}

export function evaluateTicketRefundEligibility(params: {
  now: Date;
  eventStartAt: Date;
  eventEndAt: Date;
  eventStatus: string;
  refundDeadlineHours: number;
  categoryRefundEligible: boolean;
  ticketStatus: string;
}): RefundEligibility {
  const { now, eventStartAt, eventEndAt, eventStatus, refundDeadlineHours, categoryRefundEligible, ticketStatus } =
    params;

  const deadline = computeRefundDeadline(eventStartAt, refundDeadlineHours);

  if (eventStatus === "CANCELLED") {
    return {
      eligible: false,
      deadline,
      reasonCode: "EVENT_CANCELLED_USE_CANCELLATION_FLOW",
      reasonMessage:
        "This event was cancelled by the organizer. Refunds for cancelled events are processed automatically or via the cancellation notice, not the standard refund request form.",
    };
  }

  if (ticketStatus === "CHECKED_IN") {
    return {
      eligible: false,
      deadline,
      reasonCode: "CHECKED_IN",
      reasonMessage: "This ticket has already been checked in at the event and is not eligible for a refund.",
    };
  }
  if (ticketStatus === "REFUNDED") {
    return {
      eligible: false,
      deadline,
      reasonCode: "ALREADY_REFUNDED",
      reasonMessage: "This ticket has already been refunded.",
    };
  }
  if (ticketStatus === "CANCELLED") {
    return {
      eligible: false,
      deadline,
      reasonCode: "CANCELLED_TICKET",
      reasonMessage: "This ticket has been cancelled and is not eligible for a refund.",
    };
  }

  if (!categoryRefundEligible) {
    return {
      eligible: false,
      deadline,
      reasonCode: "CATEGORY_NOT_ELIGIBLE",
      reasonMessage: "This ticket category is marked as non-refundable by the event organizer.",
    };
  }

  if (now >= eventEndAt) {
    return { eligible: false, deadline, reasonCode: "EVENT_ENDED", reasonMessage: "This event has already ended." };
  }
  if (now >= eventStartAt) {
    return {
      eligible: false,
      deadline,
      reasonCode: "EVENT_STARTED",
      reasonMessage: "This event has already started. Refund requests are not allowed after the event begins.",
    };
  }
  if (now >= deadline) {
    return { eligible: false, deadline, reasonCode: "WINDOW_CLOSED", reasonMessage: STANDARD_MESSAGE };
  }

  return { eligible: true, deadline };
}

export function formatDeadline(deadline: Date, timezone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(deadline);
}

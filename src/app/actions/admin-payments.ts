"use server";

import { requireRole } from "@/lib/auth";
import { approvePaymentProof, rejectPaymentProof } from "@/lib/booking-engine";
import { revalidatePath } from "next/cache";

// Only roles with full "payments" permission (see lib/permissions.ts) may
// approve or reject a manual payment; BOOKING_MANAGER/SUPPORT can view the
// queue but not decide it.
const STAFF = ["ADMIN", "FINANCE_MANAGER"] as const;

export async function approvePaymentAction(paymentId: string) {
  const session = await requireRole([...STAFF]);
  const result = await approvePaymentProof(paymentId, { userId: session.userId, fullName: session.fullName });
  revalidatePath("/admin/payment-verifications");
  revalidatePath(`/admin/payment-verifications/${paymentId}`);
  return result;
}

export async function rejectPaymentAction(paymentId: string, reason: string) {
  const session = await requireRole([...STAFF]);
  const result = await rejectPaymentProof(paymentId, { userId: session.userId, fullName: session.fullName }, reason);
  revalidatePath("/admin/payment-verifications");
  revalidatePath(`/admin/payment-verifications/${paymentId}`);
  return result;
}

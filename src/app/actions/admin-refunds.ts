"use server";

import { requireRole } from "@/lib/auth";
import { decideRefund, RefundError } from "@/lib/refunds";
import { revalidatePath } from "next/cache";

export async function decideRefundAction(input: {
  refundId: string;
  decision: "APPROVE_FULL" | "APPROVE_PARTIAL" | "REJECT";
  approvedAmount?: number;
  adminNotes?: string;
  customerMessage?: string;
  isOverride?: boolean;
  overrideReason?: string;
}) {
  const session = await requireRole(["ADMIN", "FINANCE_MANAGER"]);
  try {
    const id = await decideRefund({ ...input, decidedById: session.userId, decidedByName: session.fullName });
    revalidatePath("/admin/refunds");
    revalidatePath(`/admin/refunds/${input.refundId}`);
    return { ok: true as const, refundId: id };
  } catch (err) {
    if (err instanceof RefundError) return { ok: false as const, message: err.message };
    console.error(err);
    return { ok: false as const, message: "Something went wrong processing this refund." };
  }
}

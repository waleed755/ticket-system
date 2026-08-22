"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export interface DiscountFormInput {
  code: string;
  description: string;
  type: "FIXED" | "PERCENTAGE";
  value: number;
  startAt?: string;
  endAt?: string;
  usageLimit?: number;
  perCustomerLimit?: number;
  minOrderAmount: number;
  active: boolean;
  eventIds: string[];
  ticketCategoryIds: string[];
}

export async function createDiscountAction(input: DiscountFormInput) {
  const session = await requireRole(["ADMIN", "FINANCE_MANAGER"]);
  const discount = await prisma.discountCode.create({
    data: {
      code: input.code.toUpperCase(),
      description: input.description,
      type: input.type,
      value: input.value,
      startAt: input.startAt ? new Date(input.startAt) : null,
      endAt: input.endAt ? new Date(input.endAt) : null,
      usageLimit: input.usageLimit || null,
      perCustomerLimit: input.perCustomerLimit || null,
      minOrderAmount: input.minOrderAmount,
      active: input.active,
      eventLinks: { create: input.eventIds.map((eventId) => ({ eventId })) },
      categoryLinks: { create: input.ticketCategoryIds.map((ticketCategoryId) => ({ ticketCategoryId })) },
    },
  });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "discount.created", entityType: "DISCOUNT_CODE", entityId: discount.id, description: `Discount code ${discount.code} created.` });
  revalidatePath("/admin/discounts");
  return { ok: true as const };
}

export async function toggleDiscountActiveAction(id: string, active: boolean) {
  const session = await requireRole(["ADMIN", "FINANCE_MANAGER"]);
  await prisma.discountCode.update({ where: { id }, data: { active } });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "discount.toggled", entityType: "DISCOUNT_CODE", entityId: id, description: `Discount code ${active ? "activated" : "deactivated"}.` });
  revalidatePath("/admin/discounts");
  return { ok: true as const };
}

import { prisma } from "./prisma";

export interface DiscountValidationResult {
  valid: boolean;
  reason?: string;
  discountId?: string;
  discountAmount?: number;
}

export async function validateDiscountCode(params: {
  code: string;
  eventId: string;
  ticketCategoryIds: string[];
  buyerEmail: string;
  subtotal: number;
}): Promise<DiscountValidationResult> {
  const { code, eventId, ticketCategoryIds, buyerEmail, subtotal } = params;
  if (!code.trim()) return { valid: false, reason: "Enter a discount code." };

  const discount = await prisma.discountCode.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { eventLinks: true, categoryLinks: true },
  });

  if (!discount) return { valid: false, reason: "This discount code does not exist." };
  if (!discount.active) return { valid: false, reason: "This discount code is no longer active." };

  const now = new Date();
  if (discount.startAt && now < discount.startAt) {
    return { valid: false, reason: "This discount code is not active yet." };
  }
  if (discount.endAt && now > discount.endAt) {
    return { valid: false, reason: "This discount code has expired." };
  }

  if (discount.eventLinks.length > 0 && !discount.eventLinks.some((l) => l.eventId === eventId)) {
    return { valid: false, reason: "This discount code is not valid for this event." };
  }

  if (discount.categoryLinks.length > 0) {
    const allowed = new Set(discount.categoryLinks.map((l) => l.ticketCategoryId));
    const hasApplicable = ticketCategoryIds.some((id) => allowed.has(id));
    if (!hasApplicable) {
      return { valid: false, reason: "This discount code does not apply to the selected ticket categories." };
    }
  }

  if (discount.minOrderAmount > 0 && subtotal < discount.minOrderAmount) {
    return {
      valid: false,
      reason: `This code requires a minimum order of ${(discount.minOrderAmount / 100).toFixed(2)}.`,
    };
  }

  if (discount.usageLimit !== null && discount.usedCount >= discount.usageLimit) {
    return { valid: false, reason: "This discount code has reached its usage limit." };
  }

  if (discount.perCustomerLimit !== null) {
    const used = await prisma.discountRedemption.count({
      where: { discountCodeId: discount.id, customerEmail: buyerEmail.toLowerCase() },
    });
    if (used >= discount.perCustomerLimit) {
      return { valid: false, reason: "You have already used this discount code the maximum number of times." };
    }
  }

  const discountAmount =
    discount.type === "PERCENTAGE" ? Math.round((subtotal * discount.value) / 100) : Math.min(discount.value, subtotal);

  return { valid: true, discountId: discount.id, discountAmount };
}

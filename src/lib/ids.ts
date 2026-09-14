import { customAlphabet } from "nanoid";

const numeric = customAlphabet("0123456789", 6);
const alphaNumeric = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);
const codeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 24);

export function generateBookingNumber(): string {
  const date = new Date();
  const y = date.getFullYear().toString().slice(2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `BK-${y}${m}-${numeric()}`;
}

export function generateTicketNumber(): string {
  return `TKT-${alphaNumeric()}`;
}

export function generateSecureTicketCode(): string {
  return codeAlphabet();
}

export function generatePaymentReference(): string {
  return `PAY-${customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 14)()}`;
}

export function generateToken(): string {
  return customAlphabet(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    40
  )();
}

export function generateAccessCode(): string {
  return customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8)();
}

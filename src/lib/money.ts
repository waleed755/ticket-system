// All monetary amounts are stored and passed around as integer paisa
// (1 PKR = 100 paisa), the platform's default currency.

export function formatMoney(amount: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount / 100);
}

export function toCents(amount: number): number {
  return Math.round(amount * 100);
}

export function fromCents(cents: number): number {
  return cents / 100;
}

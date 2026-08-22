// Simulated payment gateway. Mimics a real processor's state machine
// (pending -> succeeded/failed, refund) using test card numbers, so every
// downstream workflow (receipts, retries, refunds) is exercised for real.
// Swap `charge`/`refund` for a live Stripe/Adyen call to go live; callers
// only depend on this interface.

export interface ChargeResult {
  success: boolean;
  reference: string;
  cardLast4: string;
  cardBrand: string;
  failureReason?: string;
}

const DECLINE_CARDS: Record<string, string> = {
  "4000000000000002": "Your card was declined by the issuing bank.",
  "4000000000009995": "Your card has insufficient funds.",
  "4000000000000069": "Your card has expired.",
};

function detectBrand(cardNumber: string): string {
  if (cardNumber.startsWith("4")) return "Visa";
  if (cardNumber.startsWith("5")) return "Mastercard";
  if (cardNumber.startsWith("3")) return "Amex";
  return "Card";
}

export function simulateCharge(input: {
  cardNumber: string;
  expiry: string;
  cvc: string;
}): ChargeResult {
  const digitsOnly = input.cardNumber.replace(/\s/g, "");
  const reference = `sim_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  const cardLast4 = digitsOnly.slice(-4);
  const cardBrand = detectBrand(digitsOnly);

  if (!/^\d{13,19}$/.test(digitsOnly)) {
    return {
      success: false,
      reference,
      cardLast4,
      cardBrand,
      failureReason: "The card number entered is invalid.",
    };
  }
  if (!/^\d{3,4}$/.test(input.cvc)) {
    return { success: false, reference, cardLast4, cardBrand, failureReason: "The security code (CVC) is invalid." };
  }

  const declineReason = DECLINE_CARDS[digitsOnly];
  if (declineReason) {
    return { success: false, reference, cardLast4, cardBrand, failureReason: declineReason };
  }

  return { success: true, reference, cardLast4, cardBrand };
}

// The simulated gateway always succeeds instantly, so the original payment
// reference and amount aren't needed to compute the result — kept as
// parameters to mirror a real provider's refund(reference, amount) signature.
export function simulateRefund(paymentReference: string, amountCents: number): { success: boolean; reference: string } {
  void paymentReference;
  void amountCents;
  return { success: true, reference: `re_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}` };
}

export const TEST_CARDS = {
  success: "4242 4242 4242 4242",
  declineGeneric: "4000 0000 0000 0002",
  declineInsufficientFunds: "4000 0000 0000 9995",
  declineExpired: "4000 0000 0000 0069",
};

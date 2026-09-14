// Simulated refund processor for admin-approved refunds on already-confirmed
// bookings. Swap `simulateRefund` for a live provider call to go live;
// callers only depend on this interface. (The original card-charging
// simulation was removed along with the card checkout UI — payments are now
// verified manually from an uploaded screenshot.)

// The simulated gateway always succeeds instantly, so the original payment
// reference and amount aren't needed to compute the result — kept as
// parameters to mirror a real provider's refund(reference, amount) signature.
export function simulateRefund(paymentReference: string, amountCents: number): { success: boolean; reference: string } {
  void paymentReference;
  void amountCents;
  return { success: true, reference: `re_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}` };
}

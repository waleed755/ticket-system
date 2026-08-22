"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Label, Alert } from "@/components/ui";
import { confirmPaymentAction } from "@/app/actions/booking";
import { TEST_CARDS } from "@/lib/payments";

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

export default function PaymentForm({
  bookingId,
  totalAmount,
  reservationExpiresAt,
}: {
  bookingId: string;
  totalAmount: number;
  reservationExpiresAt: string | null;
}) {
  const router = useRouter();
  const [cardNumber, setCardNumber] = useState(TEST_CARDS.success);
  const [expiry, setExpiry] = useState("12/28");
  const [cvc, setCvc] = useState("123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = useCountdown(reservationExpiresAt);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const result = await confirmPaymentAction({
      bookingId,
      card: totalAmount > 0 ? { cardNumber, expiry, cvc } : undefined,
    });
    setSubmitting(false);
    if (result.success) {
      router.push(`/checkout/${bookingId}/confirmation`);
    } else {
      setError(result.reason);
    }
  }

  const expired = remaining !== null && remaining <= 0;

  return (
    <Card className="p-6">
      {remaining !== null && !expired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          Your tickets are reserved for {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} more minutes.
        </p>
      )}
      {expired && <div className="mb-5"><Alert variant="error">Your reservation expired. Please go back and start a new booking.</Alert></div>}
      {error && <div className="mb-5"><Alert variant="error">{error} You have not been charged — you can retry below.</Alert></div>}

      {totalAmount === 0 ? (
        <div>
          <p className="text-sm text-gray-600 mb-4">This is a free registration — no payment is required.</p>
          <Button className="w-full" size="lg" disabled={submitting || expired} onClick={submit}>
            {submitting ? "Confirming..." : "Confirm free booking"}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber">Card number</Label>
            <Input id="cardNumber" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiry">Expiry</Label>
              <Input id="expiry" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="MM/YY" />
            </div>
            <div>
              <Label htmlFor="cvc">CVC</Label>
              <Input id="cvc" value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123" />
            </div>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p className="font-semibold text-gray-600">Test mode — try these card numbers:</p>
            <button type="button" className="block text-brand" onClick={() => setCardNumber(TEST_CARDS.success)}>{TEST_CARDS.success} — succeeds</button>
            <button type="button" className="block text-brand" onClick={() => setCardNumber(TEST_CARDS.declineGeneric)}>{TEST_CARDS.declineGeneric} — declined</button>
            <button type="button" className="block text-brand" onClick={() => setCardNumber(TEST_CARDS.declineInsufficientFunds)}>{TEST_CARDS.declineInsufficientFunds} — insufficient funds</button>
          </div>

          <Button className="w-full" size="lg" disabled={submitting || expired} onClick={submit}>
            {submitting ? "Processing payment..." : "Pay & complete booking"}
          </Button>
        </div>
      )}
    </Card>
  );
}

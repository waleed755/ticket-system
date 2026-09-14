"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Alert } from "@/components/ui";
import { confirmFreeBookingAction } from "@/app/actions/booking";

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

export default function FreeBookingConfirm({ bookingId, reservationExpiresAt }: { bookingId: string; reservationExpiresAt: string | null }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = useCountdown(reservationExpiresAt);
  const expired = remaining !== null && remaining <= 0;

  async function confirm() {
    setSubmitting(true);
    setError(null);
    const result = await confirmFreeBookingAction(bookingId);
    setSubmitting(false);
    if (result.success) {
      router.push(`/checkout/${bookingId}/confirmation`);
    } else {
      setError(result.reason);
    }
  }

  return (
    <Card className="p-6">
      {remaining !== null && !expired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          Your tickets are reserved for {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} more minutes.
        </p>
      )}
      {expired && <div className="mb-5"><Alert variant="error">Your reservation expired. Please go back and start a new booking.</Alert></div>}
      {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}
      <p className="text-sm text-gray-600 mb-4">This is a free registration — no payment is required.</p>
      <Button className="w-full" size="lg" disabled={submitting || expired} onClick={confirm}>
        {submitting ? "Confirming..." : "Confirm free booking"}
      </Button>
    </Card>
  );
}

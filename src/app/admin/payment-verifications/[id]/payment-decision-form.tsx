"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approvePaymentAction, rejectPaymentAction } from "@/app/actions/admin-payments";
import { Card, Button, Textarea, Alert } from "@/components/ui";

export default function PaymentDecisionForm({ paymentId }: { paymentId: string }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"APPROVE" | "REJECT">("APPROVE");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (decision === "REJECT" && !reason.trim()) {
      setError("A reason is required so the customer knows what to fix.");
      return;
    }
    startTransition(async () => {
      const result = decision === "APPROVE" ? await approvePaymentAction(paymentId) : await rejectPaymentAction(paymentId, reason);
      if (!result.ok) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      router.push("/admin/payment-verifications");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Decision</h2>
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2">
        {(["APPROVE", "REJECT"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDecision(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${decision === d ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-700"}`}
          >
            {d === "APPROVE" ? "Approve payment" : "Reject / request review"}
          </button>
        ))}
      </div>

      {decision === "REJECT" && (
        <div>
          <p className="text-sm font-medium text-gray-700 mb-1">Reason (sent to the customer)</p>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Amount doesn't match, screenshot unclear, wrong account..." />
        </div>
      )}

      {decision === "APPROVE" && (
        <p className="text-sm text-gray-500">
          Approving confirms the booking, generates tickets, and emails the customer their confirmed booking and tickets.
        </p>
      )}
      {decision === "REJECT" && (
        <p className="text-sm text-gray-500">
          Rejecting sends the customer an email and re-opens the booking so they can upload a corrected screenshot.
        </p>
      )}

      <Button disabled={pending} onClick={submit} variant={decision === "REJECT" ? "danger" : "primary"}>
        {pending ? "Processing..." : decision === "REJECT" ? "Reject payment" : "Approve payment"}
      </Button>
    </Card>
  );
}

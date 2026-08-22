"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { decideRefundAction } from "@/app/actions/admin-refunds";
import { Card, Button, Input, Label, Textarea, Alert } from "@/components/ui";
import { formatMoney } from "@/lib/money";

export default function RefundDecisionForm({ refundId, requestedAmount, hasIneligibleTicket }: { refundId: string; requestedAmount: number; hasIneligibleTicket: boolean }) {
  const router = useRouter();
  const [decision, setDecision] = useState<"APPROVE_FULL" | "APPROVE_PARTIAL" | "REJECT">("APPROVE_FULL");
  const [approvedAmount, setApprovedAmount] = useState(requestedAmount / 100);
  const [adminNotes, setAdminNotes] = useState("");
  const [customerMessage, setCustomerMessage] = useState("");
  const [isOverride, setIsOverride] = useState(hasIneligibleTicket);
  const [overrideReason, setOverrideReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (isOverride && !overrideReason.trim()) {
      setError("An override reason is required.");
      return;
    }
    startTransition(async () => {
      const result = await decideRefundAction({
        refundId,
        decision,
        approvedAmount: decision === "APPROVE_PARTIAL" ? Math.round(approvedAmount * 100) : undefined,
        adminNotes,
        customerMessage,
        isOverride,
        overrideReason: isOverride ? overrideReason : undefined,
      });
      if (!result.ok) {
        setError(result.message ?? "Something went wrong.");
        return;
      }
      router.push("/admin/refunds");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Decision</h2>
      {error && <Alert variant="error">{error}</Alert>}
      {hasIneligibleTicket && (
        <Alert variant="warning">One or more selected tickets fall outside the standard 48-hour refund window. Approving requires an authorized override with a reason.</Alert>
      )}

      <div className="flex gap-2">
        {(["APPROVE_FULL", "APPROVE_PARTIAL", "REJECT"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDecision(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${decision === d ? "bg-brand text-white border-brand" : "border-gray-300 text-gray-700"}`}
          >
            {d === "APPROVE_FULL" ? "Approve full" : d === "APPROVE_PARTIAL" ? "Approve partial" : "Reject"}
          </button>
        ))}
      </div>

      {decision === "APPROVE_PARTIAL" && (
        <div>
          <Label>Approved amount</Label>
          <Input type="number" step="0.01" value={approvedAmount} onChange={(e) => setApprovedAmount(Number(e.target.value))} />
          <p className="text-xs text-gray-400 mt-1">Requested: {formatMoney(requestedAmount)}</p>
        </div>
      )}

      <div>
        <Label>Internal notes</Label>
        <Textarea rows={2} value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} />
      </div>
      <div>
        <Label>Message to customer</Label>
        <Textarea rows={2} value={customerMessage} onChange={(e) => setCustomerMessage(e.target.value)} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isOverride} onChange={(e) => setIsOverride(e.target.checked)} />
        This is an authorized override of the standard refund policy
      </label>
      {isOverride && (
        <div>
          <Label>Override reason (required, recorded in activity log)</Label>
          <Textarea rows={2} value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} />
        </div>
      )}

      <Button disabled={pending} onClick={submit} variant={decision === "REJECT" ? "danger" : "primary"}>
        {pending ? "Processing..." : decision === "REJECT" ? "Reject request" : "Approve & process refund"}
      </Button>
    </Card>
  );
}

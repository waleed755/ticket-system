"use client";

import { useState, useTransition } from "react";
import { requestRefundAction } from "@/app/actions/account";
import { Button, Textarea, Label, Alert } from "@/components/ui";
import { formatMoney } from "@/lib/money";

interface RefundableTicket {
  id: string;
  attendeeName: string;
  categoryName: string;
  price: number;
}

export default function RefundRequestForm({ bookingId, tickets }: { bookingId: string; tickets: RefundableTicket[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const total = tickets.filter((t) => selected.includes(t.id)).reduce((s, t) => s + t.price, 0);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  function submit() {
    startTransition(async () => {
      const res = await requestRefundAction({ bookingId, ticketIds: selected, reason, additionalNotes: notes });
      setResult(res.ok ? { ok: true } : { ok: false, message: res.message });
    });
  }

  if (result?.ok) return <Alert variant="success">Refund request submitted. You can track its status below.</Alert>;

  if (tickets.length === 0) return null;

  return (
    <div className="space-y-4">
      {result && !result.ok && <Alert variant="error">{result.message}</Alert>}
      <div>
        <Label>Select tickets to refund</Label>
        <div className="space-y-2">
          {tickets.map((t) => (
            <label key={t.id} className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm">
              <span className="flex items-center gap-2">
                <input type="checkbox" checked={selected.includes(t.id)} onChange={() => toggle(t.id)} />
                {t.attendeeName} ({t.categoryName})
              </span>
              <span className="font-medium">{formatMoney(t.price)}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <Label htmlFor="reason">Reason for refund</Label>
        <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required />
      </div>
      <div>
        <Label htmlFor="notes">Additional details (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
      </div>
      <div className="flex justify-between items-center pt-2 border-t border-gray-100">
        <p className="text-sm text-gray-500">Estimated refund: <span className="font-semibold text-gray-900">{formatMoney(total)}</span></p>
        <Button disabled={selected.length === 0 || !reason || pending} onClick={submit}>
          {pending ? "Submitting..." : "Submit refund request"}
        </Button>
      </div>
    </div>
  );
}

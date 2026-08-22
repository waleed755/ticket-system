"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBookingNoteAction, resendTicketsAdminAction, cancelBookingAction, invalidateTicketAction } from "@/app/actions/admin-bookings";
import { Button, Textarea, Input, Alert } from "@/components/ui";

export function NoteForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="space-y-2">
      <Textarea rows={2} placeholder="Add an internal note (not visible to the customer)..." value={note} onChange={(e) => setNote(e.target.value)} />
      <Button
        size="sm"
        disabled={!note || pending}
        onClick={() =>
          startTransition(async () => {
            await addBookingNoteAction(bookingId, note);
            setNote("");
            router.refresh();
          })
        }
      >
        {pending ? "Saving..." : "Add note"}
      </Button>
    </div>
  );
}

export function ResendButton({ bookingId }: { bookingId: string }) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={pending || sent}
      onClick={() => startTransition(async () => { await resendTicketsAdminAction(bookingId); setSent(true); })}
    >
      {sent ? "Sent!" : pending ? "Sending..." : "Resend tickets"}
    </Button>
  );
}

export function CancelBookingForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) return <Button size="sm" variant="danger" onClick={() => setOpen(true)}>Cancel booking</Button>;

  return (
    <div className="border border-red-200 bg-red-50 rounded-lg p-3 space-y-2">
      <Textarea rows={2} placeholder="Reason for cancellation..." value={reason} onChange={(e) => setReason(e.target.value)} />
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="danger"
          disabled={!reason || pending}
          onClick={() =>
            startTransition(async () => {
              await cancelBookingAction(bookingId, reason);
              router.refresh();
            })
          }
        >
          Confirm cancel
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Close</Button>
      </div>
    </div>
  );
}

export function InvalidateTicketButton({ ticketId, bookingId }: { ticketId: string; bookingId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  if (!open) return <button className="text-xs text-red-600 font-semibold" onClick={() => setOpen(true)}>Invalidate</button>;

  return (
    <div className="flex items-center gap-1">
      <Input className="!w-32 !py-1 !text-xs" placeholder="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <button
        className="text-xs text-red-600 font-semibold disabled:opacity-40"
        disabled={!reason || pending}
        onClick={() =>
          startTransition(async () => {
            await invalidateTicketAction(ticketId, bookingId, reason);
            router.refresh();
          })
        }
      >
        Confirm
      </button>
    </div>
  );
}

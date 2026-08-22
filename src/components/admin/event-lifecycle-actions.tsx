"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  publishEventAction,
  unpublishEventAction,
  pauseSalesAction,
  resumeSalesAction,
  archiveEventAction,
  markCompletedAction,
  cancelEventAction,
  rescheduleEventAction,
  duplicateEventAction,
} from "@/app/actions/admin-events";
import { Button, Input, Label, Textarea, Alert } from "@/components/ui";

export default function EventLifecycleActions({ eventId, status }: { eventId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showCancel, setShowCancel] = useState(false);
  const [showReschedule, setShowReschedule] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [rescheduleData, setRescheduleData] = useState({ newStartAt: "", newEndAt: "", newVenueName: "", note: "" });
  const [message, setMessage] = useState<string | null>(null);

  function run(action: () => Promise<{ ok: boolean; notifiedCount?: number }>) {
    startTransition(async () => {
      const result = await action();
      if (result.notifiedCount !== undefined) setMessage(`Done. ${result.notifiedCount} customer(s) notified by email.`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      {message && <Alert variant="success">{message}</Alert>}
      <div className="flex flex-wrap gap-2">
        {status === "DRAFT" && <Button size="sm" disabled={pending} onClick={() => run(() => publishEventAction(eventId))}>Publish</Button>}
        {status === "PUBLISHED" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => unpublishEventAction(eventId))}>Unpublish to draft</Button>}
        {status === "PUBLISHED" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => pauseSalesAction(eventId))}>Pause sales</Button>}
        {status === "PAUSED" && <Button size="sm" disabled={pending} onClick={() => run(() => resumeSalesAction(eventId))}>Resume sales</Button>}
        {(status === "PUBLISHED" || status === "PAUSED") && <Button size="sm" variant="secondary" onClick={() => setShowReschedule((s) => !s)}>Reschedule</Button>}
        {status !== "CANCELLED" && status !== "COMPLETED" && <Button size="sm" variant="danger" onClick={() => setShowCancel((s) => !s)}>Cancel event</Button>}
        {(status === "PUBLISHED" || status === "PAUSED") && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => markCompletedAction(eventId))}>Mark completed</Button>}
        {status !== "ARCHIVED" && <Button size="sm" variant="secondary" disabled={pending} onClick={() => run(() => archiveEventAction(eventId))}>Archive</Button>}
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await duplicateEventAction(eventId);
              if (result.ok) router.push(`/admin/events/${result.eventId}/edit`);
            })
          }
        >
          Duplicate
        </Button>
      </div>

      {showCancel && (
        <div className="border border-red-200 bg-red-50 rounded-lg p-4 space-y-3">
          <Label>Cancellation reason (shown to customers)</Label>
          <Textarea rows={2} value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
          <div className="flex gap-2">
            <Button
              variant="danger"
              size="sm"
              disabled={!cancelReason || pending}
              onClick={() => run(() => cancelEventAction(eventId, cancelReason))}
            >
              Confirm cancellation & notify customers
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowCancel(false)}>Close</Button>
          </div>
        </div>
      )}

      {showReschedule && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>New start date/time</Label><Input type="datetime-local" value={rescheduleData.newStartAt} onChange={(e) => setRescheduleData({ ...rescheduleData, newStartAt: e.target.value })} /></div>
            <div><Label>New end date/time</Label><Input type="datetime-local" value={rescheduleData.newEndAt} onChange={(e) => setRescheduleData({ ...rescheduleData, newEndAt: e.target.value })} /></div>
            <div className="sm:col-span-2"><Label>New venue (optional)</Label><Input value={rescheduleData.newVenueName} onChange={(e) => setRescheduleData({ ...rescheduleData, newVenueName: e.target.value })} /></div>
          </div>
          <Label>What changed? (shown to customers)</Label>
          <Textarea rows={2} value={rescheduleData.note} onChange={(e) => setRescheduleData({ ...rescheduleData, note: e.target.value })} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={!rescheduleData.newStartAt || !rescheduleData.newEndAt || !rescheduleData.note || pending}
              onClick={() => run(() => rescheduleEventAction(eventId, rescheduleData))}
            >
              Confirm reschedule & notify customers
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowReschedule(false)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}

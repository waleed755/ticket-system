"use client";

import { useState, useTransition } from "react";
import { updateAttendeeAction } from "@/app/actions/account";
import { Button, Input, Label } from "@/components/ui";

export default function AttendeeEditor({
  bookingId,
  attendeeId,
  initial,
}: {
  bookingId: string;
  attendeeId: string;
  initial: { email: string; phone: string; dietaryNeeds: string; accessibilityNeeds: string; emergencyContact: string };
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(initial);
  const [pending, startTransition] = useTransition();

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)} className="text-xs text-brand font-semibold">
        Edit contact info
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 border-t border-gray-100 pt-2">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label>Email</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div>
          <Label>Phone</Label>
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <Label>Dietary needs</Label>
          <Input value={form.dietaryNeeds} onChange={(e) => setForm({ ...form, dietaryNeeds: e.target.value })} />
        </div>
        <div>
          <Label>Accessibility needs</Label>
          <Input value={form.accessibilityNeeds} onChange={(e) => setForm({ ...form, accessibilityNeeds: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Emergency contact</Label>
          <Input value={form.emergencyContact} onChange={(e) => setForm({ ...form, emergencyContact: e.target.value })} />
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateAttendeeAction({ attendeeId, bookingId, ...form });
              setEditing(false);
            })
          }
        >
          {pending ? "Saving..." : "Save"}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  );
}

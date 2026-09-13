"use client";

import { useState, useTransition } from "react";
import { submitContactMessage } from "@/app/actions/public";
import { Button, Input, Label, Textarea, Alert } from "@/components/ui";

export default function OrganizerForm() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (status?.ok) return <Alert variant="success">{status.message}</Alert>;

  return (
    <form
      action={(formData) => {
        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");
        const eventName = String(formData.get("eventName") || "");
        const details = String(formData.get("details") || "");

        const wrapped = new FormData();
        wrapped.set("name", name);
        wrapped.set("email", email);
        wrapped.set("subject", "Organizer inquiry — List an event");
        wrapped.set("message", `Event / brand name: ${eventName}\n\n${details}`);

        startTransition(async () => {
          const result = await submitContactMessage(wrapped);
          setStatus(result);
        });
      }}
      className="space-y-4"
    >
      {status && !status.ok && <Alert variant="error">{status.message}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Your name</Label>
          <Input id="name" name="name" required />
        </div>
        <div>
          <Label htmlFor="email">Email address</Label>
          <Input id="email" name="email" type="email" required />
        </div>
      </div>
      <div>
        <Label htmlFor="eventName">Event or brand name</Label>
        <Input id="eventName" name="eventName" placeholder="e.g. Actual Wala Live" required />
      </div>
      <div>
        <Label htmlFor="details">Tell us about your event</Label>
        <Textarea id="details" name="details" rows={5} placeholder="Event type, expected date, city, and roughly how many tickets you'd like to sell." required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Submit inquiry"}</Button>
    </form>
  );
}

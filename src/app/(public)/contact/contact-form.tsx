"use client";

import { useState, useTransition } from "react";
import { submitContactMessage } from "@/app/actions/public";
import { Button, Input, Label, Textarea, Alert } from "@/components/ui";

export default function ContactForm() {
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (status?.ok) return <Alert variant="success">{status.message}</Alert>;

  return (
    <form
      action={(formData) => {
        startTransition(async () => {
          const result = await submitContactMessage(formData);
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
        <Label htmlFor="subject">Subject</Label>
        <Input id="subject" name="subject" required />
      </div>
      <div>
        <Label htmlFor="message">Message</Label>
        <Textarea id="message" name="message" rows={5} required />
      </div>
      <Button type="submit" disabled={pending}>{pending ? "Sending..." : "Send message"}</Button>
    </form>
  );
}

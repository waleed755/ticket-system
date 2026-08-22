"use client";

import { useState, useTransition } from "react";
import { requestPasswordResetAction } from "@/app/actions/auth";
import { Button, Input, Label, Alert } from "@/components/ui";

export default function ForgotForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await requestPasswordResetAction({ email });
      setMessage(result.message);
    });
  }

  if (message) return <Alert variant="success">{message}</Alert>;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Sending..." : "Send reset link"}</Button>
    </form>
  );
}

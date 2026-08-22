"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { activateAccountAction } from "@/app/actions/auth";
import { Button, Input, Label, Alert } from "@/components/ui";

export default function ActivateForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      const result = await activateAccountAction({ token, password });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/account");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <Label htmlFor="password">Create a password</Label>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      </div>
      <div>
        <Label htmlFor="confirm">Confirm password</Label>
        <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Activating..." : "Activate my account"}</Button>
    </form>
  );
}

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { Button, Input, Label, Alert } from "@/components/ui";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await loginAction({ email, password });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.role === "CUSTOMER") router.push("/account");
      else if (result.role === "CHECKIN_STAFF") router.push("/checkin");
      else router.push("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div>
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="password">Password</Label>
          <Link href="/forgot-password" className="text-xs text-brand font-semibold">Forgot password?</Link>
        </div>
        <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
    </form>
  );
}

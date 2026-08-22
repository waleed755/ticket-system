"use client";

import { useState, useTransition } from "react";
import { updateProfileAction, changePasswordAction } from "@/app/actions/account";
import { Button, Input, Label, Alert, Card } from "@/components/ui";

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [name, setName] = useState(fullName);
  const [phoneVal, setPhoneVal] = useState(phone);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
      {saved && <div className="mb-4"><Alert variant="success">Profile updated.</Alert></div>}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Full name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="phone">Phone number</Label>
          <Input id="phone" value={phoneVal} onChange={(e) => setPhoneVal(e.target.value)} />
        </div>
        <Button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await updateProfileAction({ fullName: name, phone: phoneVal });
              setSaved(true);
            })
          }
        >
          {pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </Card>
  );
}

export function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    if (next !== confirm) {
      setResult({ ok: false, message: "New passwords do not match." });
      return;
    }
    startTransition(async () => {
      const res = await changePasswordAction({ currentPassword: current, newPassword: next });
      setResult(res.ok ? { ok: true } : { ok: false, message: res.message });
      if (res.ok) {
        setCurrent("");
        setNext("");
        setConfirm("");
      }
    });
  }

  return (
    <Card className="p-6">
      <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
      {result && (result.ok ? <div className="mb-4"><Alert variant="success">Password changed.</Alert></div> : <div className="mb-4"><Alert variant="error">{result.message}</Alert></div>)}
      <div className="space-y-4">
        <div>
          <Label htmlFor="current">Current password</Label>
          <Input id="current" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="next">New password</Label>
          <Input id="next" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} />
        </div>
        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} minLength={8} />
        </div>
        <Button disabled={pending} onClick={submit}>{pending ? "Saving..." : "Update password"}</Button>
      </div>
    </Card>
  );
}

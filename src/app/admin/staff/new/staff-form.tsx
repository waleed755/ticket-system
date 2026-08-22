"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createStaffAction } from "@/app/actions/admin-staff";
import { Card, Button, Input, Label, Select, Alert } from "@/components/ui";
import { roleLabels } from "@/lib/permissions";
import type { Role } from "@prisma/client";

const ASSIGNABLE_ROLES: Role[] = ["ADMIN", "EVENT_MANAGER", "BOOKING_MANAGER", "FINANCE_MANAGER", "SUPPORT", "CHECKIN_STAFF"];

export default function StaffForm({ events }: { events: { id: string; name: string }[] }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("SUPPORT");
  const [password, setPassword] = useState("");
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const needsAssignment = role === "EVENT_MANAGER" || role === "CHECKIN_STAFF";

  function submit() {
    setError(null);
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    startTransition(async () => {
      await createStaffAction({ fullName, email, role, password, eventIds: needsAssignment ? eventIds : [] });
      router.push("/admin/staff");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 space-y-4 max-w-xl">
      {error && <Alert variant="error">{error}</Alert>}
      <div><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div>
        <Label>Role</Label>
        <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
          {ASSIGNABLE_ROLES.map((r) => <option key={r} value={r}>{roleLabels[r]}</option>)}
        </Select>
      </div>
      <div><Label>Temporary password</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} /></div>
      {needsAssignment && (
        <div>
          <Label>Assigned events</Label>
          <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
            {events.map((e) => (
              <label key={e.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={eventIds.includes(e.id)} onChange={(ev) => setEventIds(ev.target.checked ? [...eventIds, e.id] : eventIds.filter((id) => id !== e.id))} />
                {e.name}
              </label>
            ))}
          </div>
        </div>
      )}
      <Button disabled={!fullName || !email || pending} onClick={submit}>{pending ? "Creating..." : "Create staff account"}</Button>
    </Card>
  );
}

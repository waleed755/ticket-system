"use client";

import { useState, useTransition } from "react";
import { joinWaitlistAction } from "@/app/actions/waitlist";
import { Card, Button, Input, Label, Select, Alert } from "@/components/ui";

export default function WaitlistForm({ eventId, categories }: { eventId: string; categories: { id: string; name: string }[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  if (done) return <Alert variant="success">You&apos;re on the list! We&apos;ll email you at {email} the moment tickets become available.</Alert>;

  return (
    <Card className="p-6 space-y-4 max-w-md">
      <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
      <div><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div><Label>Phone (optional)</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      {categories.length > 0 && (
        <div>
          <Label>Preferred ticket category</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      )}
      <Button
        disabled={!name || !email || pending}
        onClick={() =>
          startTransition(async () => {
            await joinWaitlistAction({ eventId, ticketCategoryId: categoryId || undefined, name, email, phone });
            setDone(true);
          })
        }
      >
        {pending ? "Joining..." : "Join waiting list"}
      </Button>
    </Card>
  );
}

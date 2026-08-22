"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendAnnouncementAction } from "@/app/actions/admin-communications";
import { Card, Button, Input, Label, Select, Textarea, Alert } from "@/components/ui";

interface EventOption {
  id: string;
  name: string;
  ticketCategories: { id: string; name: string }[];
}

export default function AnnouncementForm({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [result, setResult] = useState<{ ok: boolean; recipientCount?: number } | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = events.find((e) => e.id === eventId)?.ticketCategories ?? [];

  function submit() {
    startTransition(async () => {
      const res = await sendAnnouncementAction({ eventId, subject, message, ticketCategoryIds: categoryIds });
      setResult(res);
      setSubject("");
      setMessage("");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <h2 className="font-semibold text-gray-900">Send an announcement</h2>
      {result?.ok && <Alert variant="success">Sent to {result.recipientCount} booking(s).</Alert>}
      <div>
        <Label>Event</Label>
        <Select value={eventId} onChange={(e) => { setEventId(e.target.value); setCategoryIds([]); }}>
          {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </Select>
      </div>
      <div>
        <Label>Audience</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <label key={c.id} className="flex items-center gap-1 text-sm border border-gray-200 rounded-full px-2 py-1">
              <input type="checkbox" checked={categoryIds.includes(c.id)} onChange={(e) => setCategoryIds(e.target.checked ? [...categoryIds, c.id] : categoryIds.filter((id) => id !== c.id))} />
              {c.name}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1">Leave all unchecked to send to every confirmed attendee.</p>
      </div>
      <div><Label>Subject</Label><Input value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div><Label>Message</Label><Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} /></div>
      <Button disabled={!subject || !message || pending} onClick={submit}>{pending ? "Sending..." : "Send announcement"}</Button>
    </Card>
  );
}

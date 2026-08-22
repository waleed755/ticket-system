"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createManualBookingAction } from "@/app/actions/admin-bookings";
import { Card, Button, Input, Label, Select, Alert } from "@/components/ui";

interface EventOption {
  id: string;
  name: string;
  ticketCategories: { id: string; name: string }[];
}

export default function ManualBookingForm({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [ticketCategoryId, setTicketCategoryId] = useState(events[0]?.ticketCategories[0]?.id ?? "");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [attendeeNamesText, setAttendeeNamesText] = useState("");
  const [isComplimentary, setIsComplimentary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const categories = events.find((e) => e.id === eventId)?.ticketCategories ?? [];

  function submit() {
    setError(null);
    const attendeeNames = attendeeNamesText.split("\n").map((s) => s.trim()).filter(Boolean);
    if (attendeeNames.length === 0) {
      setError("Enter at least one attendee name.");
      return;
    }
    startTransition(async () => {
      const result = await createManualBookingAction({ eventId, ticketCategoryId, buyerName, buyerEmail, buyerPhone, attendeeNames, isComplimentary });
      if (result.ok) router.push(`/admin/bookings/${result.bookingId}`);
    });
  }

  return (
    <Card className="p-6 space-y-4 max-w-2xl">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Event</Label>
          <Select value={eventId} onChange={(e) => { setEventId(e.target.value); setTicketCategoryId(events.find((ev) => ev.id === e.target.value)?.ticketCategories[0]?.id ?? ""); }}>
            {events.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Ticket category</Label>
          <Select value={ticketCategoryId} onChange={(e) => setTicketCategoryId(e.target.value)}>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div><Label>Buyer name</Label><Input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} /></div>
        <div><Label>Buyer email</Label><Input type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} /></div>
        <div><Label>Buyer phone</Label><Input value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} /></div>
      </div>
      <div>
        <Label>Attendee names (one per line)</Label>
        <textarea rows={4} value={attendeeNamesText} onChange={(e) => setAttendeeNamesText(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isComplimentary} onChange={(e) => setIsComplimentary(e.target.checked)} />
        Complimentary (no charge)
      </label>
      <Button disabled={!buyerName || !buyerEmail || pending} onClick={submit}>{pending ? "Creating..." : "Create booking"}</Button>
    </Card>
  );
}

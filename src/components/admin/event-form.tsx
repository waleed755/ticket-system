"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Input, Label, Select, Textarea, Alert } from "@/components/ui";
import { createEventAction, updateEventAction, type EventFormInput } from "@/app/actions/admin-events";
import { formatMoney } from "@/lib/money";
import { CoverImageUpload, GalleryUpload } from "@/components/admin/image-upload";

interface Category {
  id: string;
  name: string;
}

function toLocalInput(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventForm({
  categories,
  eventId,
  initial,
}: {
  categories: Category[];
  eventId?: string;
  initial?: Partial<EventFormInput>;
}) {
  const router = useRouter();
  const [form, setForm] = useState<EventFormInput>({
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    fullDescription: initial?.fullDescription ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    coverImage: initial?.coverImage ?? "",
    images: initial?.images ?? [],
    format: initial?.format ?? "PHYSICAL",
    venueName: initial?.venueName ?? "",
    addressLine1: initial?.addressLine1 ?? "",
    city: initial?.city ?? "",
    region: initial?.region ?? "",
    country: initial?.country ?? "",
    postalCode: initial?.postalCode ?? "",
    mapUrl: initial?.mapUrl ?? "",
    onlineUrl: initial?.onlineUrl ?? "",
    onlineInstructions: initial?.onlineInstructions ?? "",
    startAt: initial?.startAt ?? "",
    endAt: initial?.endAt ?? "",
    timezone: initial?.timezone ?? "America/New_York",
    capacity: initial?.capacity ?? 100,
    bookingStartAt: initial?.bookingStartAt ?? "",
    bookingEndAt: initial?.bookingEndAt ?? "",
    refundDeadlineHours: initial?.refundDeadlineHours ?? 48,
    refundPolicy: initial?.refundPolicy ?? "Full refunds are available up until 48 hours before the event starts.",
    termsAndConditions: initial?.termsAndConditions ?? "",
    ageRestriction: initial?.ageRestriction ?? "",
    entryRequirements: initial?.entryRequirements ?? "",
    dressCode: initial?.dressCode ?? "",
    accessibilityInfo: initial?.accessibilityInfo ?? "",
    organizerName: initial?.organizerName ?? "",
    organizerEmail: initial?.organizerEmail ?? "",
    organizerPhone: initial?.organizerPhone ?? "",
    organizerBio: initial?.organizerBio ?? "",
    confirmationMessage: initial?.confirmationMessage ?? "",
    visibility: initial?.visibility ?? "PUBLIC",
    accessCode: initial?.accessCode ?? "",
    waitlistEnabled: initial?.waitlistEnabled ?? false,
    featured: initial?.featured ?? false,
    returnRefundsToInventory: initial?.returnRefundsToInventory ?? true,
    faqs: initial?.faqs ?? [],
    questions: initial?.questions ?? [],
    ticketCategories: initial?.ticketCategories ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function update<K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function submit() {
    setError(null);
    const payload = { ...form };
    startTransition(async () => {
      if (eventId) {
        const result = await updateEventAction(eventId, payload);
        if (!result.ok) {
          setError("Something went wrong.");
          return;
        }
        router.push(`/admin/events/${eventId}/edit`);
      } else {
        const result = await createEventAction(payload);
        if (!result.ok) {
          setError("Something went wrong.");
          return;
        }
        router.push(`/admin/events/${result.eventId}/edit`);
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basics</h2>
        <div>
          <Label>Event name</Label>
          <Input value={form.name} onChange={(e) => update("name", e.target.value)} required />
        </div>
        <div>
          <Label>Short description</Label>
          <Textarea rows={2} value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} required />
        </div>
        <div>
          <Label>Full description</Label>
          <Textarea rows={5} value={form.fullDescription} onChange={(e) => update("fullDescription", e.target.value)} required />
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div>
            <Label>Format</Label>
            <Select value={form.format} onChange={(e) => update("format", e.target.value as EventFormInput["format"])}>
              <option value="PHYSICAL">Physical</option>
              <option value="ONLINE">Online</option>
              <option value="HYBRID">Hybrid</option>
            </Select>
          </div>
        </div>
        <div>
          <Label>Cover image (banner)</Label>
          <CoverImageUpload value={form.coverImage} onChange={(url) => update("coverImage", url)} />
        </div>
        <div>
          <Label>Gallery images</Label>
          <GalleryUpload value={form.images} onChange={(images) => update("images", images)} />
        </div>
      </Card>

      {form.format !== "ONLINE" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Venue</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Venue name</Label><Input value={form.venueName} onChange={(e) => update("venueName", e.target.value)} /></div>
            <div><Label>Address</Label><Input value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} /></div>
            <div><Label>City</Label><Input value={form.city} onChange={(e) => update("city", e.target.value)} /></div>
            <div><Label>Region / State</Label><Input value={form.region} onChange={(e) => update("region", e.target.value)} /></div>
            <div><Label>Country</Label><Input value={form.country} onChange={(e) => update("country", e.target.value)} /></div>
            <div><Label>Postal code</Label><Input value={form.postalCode} onChange={(e) => update("postalCode", e.target.value)} /></div>
            <div className="sm:col-span-2"><Label>Map URL</Label><Input value={form.mapUrl} onChange={(e) => update("mapUrl", e.target.value)} /></div>
          </div>
        </Card>
      )}

      {form.format !== "PHYSICAL" && (
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900">Online details</h2>
          <div><Label>Online access URL</Label><Input value={form.onlineUrl} onChange={(e) => update("onlineUrl", e.target.value)} /></div>
          <div><Label>Instructions</Label><Textarea rows={2} value={form.onlineInstructions} onChange={(e) => update("onlineInstructions", e.target.value)} /></div>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Date, time & capacity</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Start date/time</Label><Input type="datetime-local" value={form.startAt ? toLocalInput(form.startAt) : ""} onChange={(e) => update("startAt", e.target.value)} required /></div>
          <div><Label>End date/time</Label><Input type="datetime-local" value={form.endAt ? toLocalInput(form.endAt) : ""} onChange={(e) => update("endAt", e.target.value)} required /></div>
          <div>
            <Label>Time zone</Label>
            <Select value={form.timezone} onChange={(e) => update("timezone", e.target.value)}>
              {["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "UTC", "Europe/London"].map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
          </div>
          <div><Label>Capacity</Label><Input type="number" value={form.capacity} onChange={(e) => update("capacity", Number(e.target.value))} required /></div>
          <div><Label>Booking opens</Label><Input type="datetime-local" value={form.bookingStartAt ? toLocalInput(form.bookingStartAt) : ""} onChange={(e) => update("bookingStartAt", e.target.value)} required /></div>
          <div><Label>Booking closes</Label><Input type="datetime-local" value={form.bookingEndAt ? toLocalInput(form.bookingEndAt) : ""} onChange={(e) => update("bookingEndAt", e.target.value)} required /></div>
        </div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Ticket categories</h2>
        {form.ticketCategories.map((c, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <p className="text-sm font-semibold text-gray-700">Category {i + 1}</p>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => update("ticketCategories", form.ticketCategories.filter((_, idx) => idx !== i))}
              >
                Remove
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Input placeholder="Name" value={c.name} onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              <Input
                type="number"
                placeholder="Price (PKR)"
                value={c.price / 100}
                onChange={(e) =>
                  update(
                    "ticketCategories",
                    form.ticketCategories.map((x, idx) => (idx === i ? { ...x, price: Math.round(Number(e.target.value) * 100) } : x))
                  )
                }
              />
              <Input
                type="number"
                placeholder="Total quantity"
                value={c.totalQuantity}
                onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, totalQuantity: Number(e.target.value) } : x)))}
              />
              <Input
                type="number"
                placeholder="Min per order"
                value={c.minPerOrder}
                onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, minPerOrder: Number(e.target.value) } : x)))}
              />
              <Input
                type="number"
                placeholder="Max per order"
                value={c.maxPerOrder}
                onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, maxPerOrder: Number(e.target.value) } : x)))}
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={c.refundEligible}
                  onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, refundEligible: e.target.checked } : x)))}
                />
                Refund eligible
              </label>
            </div>
            <Input placeholder="Description" value={c.description} onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, description: e.target.value } : x)))} />
            <Input placeholder="Benefits" value={c.benefits} onChange={(e) => update("ticketCategories", form.ticketCategories.map((x, idx) => (idx === i ? { ...x, benefits: e.target.value } : x)))} />
            <p className="text-xs text-gray-400">Price preview: {formatMoney(c.price || 0)}</p>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            update("ticketCategories", [
              ...form.ticketCategories,
              { name: "", description: "", price: 0, totalQuantity: 100, minPerOrder: 1, maxPerOrder: 10, refundEligible: true, benefits: "" },
            ])
          }
        >
          + Add ticket category
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Attendee questions</h2>
        {form.questions.map((q, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 flex gap-3 items-center">
            <Input placeholder="Question label" value={q.label} onChange={(e) => update("questions", form.questions.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))} />
            <Select value={q.type} onChange={(e) => update("questions", form.questions.map((x, idx) => (idx === i ? { ...x, type: e.target.value } : x)))} className="w-40">
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">Date</option>
              <option value="SELECT">Select</option>
              <option value="CHECKBOX">Checkbox</option>
            </Select>
            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
              <input type="checkbox" checked={q.required} onChange={(e) => update("questions", form.questions.map((x, idx) => (idx === i ? { ...x, required: e.target.checked } : x)))} />
              Required
            </label>
            <button type="button" className="text-xs text-red-600" onClick={() => update("questions", form.questions.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => update("questions", [...form.questions, { label: "", type: "TEXT", options: "", required: false }])}>
          + Add question
        </Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">FAQs</h2>
        {form.faqs.map((f, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-3 space-y-2">
            <Input placeholder="Question" value={f.question} onChange={(e) => update("faqs", form.faqs.map((x, idx) => (idx === i ? { ...x, question: e.target.value } : x)))} />
            <Textarea rows={2} placeholder="Answer" value={f.answer} onChange={(e) => update("faqs", form.faqs.map((x, idx) => (idx === i ? { ...x, answer: e.target.value } : x)))} />
            <button type="button" className="text-xs text-red-600" onClick={() => update("faqs", form.faqs.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        ))}
        <Button type="button" variant="secondary" size="sm" onClick={() => update("faqs", [...form.faqs, { question: "", answer: "" }])}>+ Add FAQ</Button>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Policies & requirements</h2>
        <div><Label>Refund deadline (hours before event)</Label><Input type="number" value={form.refundDeadlineHours} onChange={(e) => update("refundDeadlineHours", Number(e.target.value))} /></div>
        <div><Label>Refund policy</Label><Textarea rows={2} value={form.refundPolicy} onChange={(e) => update("refundPolicy", e.target.value)} /></div>
        <div><Label>Terms & conditions</Label><Textarea rows={3} value={form.termsAndConditions} onChange={(e) => update("termsAndConditions", e.target.value)} /></div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Age restriction</Label><Input value={form.ageRestriction} onChange={(e) => update("ageRestriction", e.target.value)} /></div>
          <div><Label>Entry requirements</Label><Input value={form.entryRequirements} onChange={(e) => update("entryRequirements", e.target.value)} /></div>
          <div><Label>Dress code</Label><Input value={form.dressCode} onChange={(e) => update("dressCode", e.target.value)} /></div>
          <div><Label>Accessibility info</Label><Input value={form.accessibilityInfo} onChange={(e) => update("accessibilityInfo", e.target.value)} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.returnRefundsToInventory} onChange={(e) => update("returnRefundsToInventory", e.target.checked)} />
          Return refunded tickets to available inventory
        </label>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Organizer</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Organizer name</Label><Input value={form.organizerName} onChange={(e) => update("organizerName", e.target.value)} required /></div>
          <div><Label>Organizer email</Label><Input type="email" value={form.organizerEmail} onChange={(e) => update("organizerEmail", e.target.value)} required /></div>
          <div><Label>Organizer phone</Label><Input value={form.organizerPhone} onChange={(e) => update("organizerPhone", e.target.value)} /></div>
        </div>
        <div><Label>Organizer bio</Label><Textarea rows={2} value={form.organizerBio} onChange={(e) => update("organizerBio", e.target.value)} /></div>
        <div><Label>Confirmation message</Label><Textarea rows={2} value={form.confirmationMessage} onChange={(e) => update("confirmationMessage", e.target.value)} /></div>
      </Card>

      <Card className="p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Visibility</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Visibility</Label>
            <Select value={form.visibility} onChange={(e) => update("visibility", e.target.value as EventFormInput["visibility"])}>
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private (access code required)</option>
            </Select>
          </div>
          {form.visibility === "PRIVATE" && (
            <div><Label>Access code</Label><Input value={form.accessCode} onChange={(e) => update("accessCode", e.target.value)} placeholder="Auto-generated if left blank" /></div>
          )}
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} /> Featured on homepage
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.waitlistEnabled} onChange={(e) => update("waitlistEnabled", e.target.checked)} /> Enable waiting list when sold out
        </label>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={() => router.back()}>Cancel</Button>
        <Button disabled={pending} onClick={submit}>{pending ? "Saving..." : eventId ? "Save changes" : "Create draft event"}</Button>
      </div>
    </div>
  );
}

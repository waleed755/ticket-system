"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Card, Button, Input, Label, Select, Alert, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createBookingAction, checkDiscountCodeAction } from "@/app/actions/booking";

interface Category {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  minPerOrder: number;
  maxPerOrder: number;
  status: string;
  remaining: number;
  benefits: string | null;
}
interface Question {
  id: string;
  label: string;
  type: string;
  options: string[];
  required: boolean;
}
interface EventInfo {
  id: string;
  slug: string;
  name: string;
  startAt: string;
  timezone: string;
  refundPolicy: string;
  termsAndConditions: string;
  currency: string;
}

interface AttendeeForm {
  ticketCategoryId: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  idNumber: string;
  emergencyContact: string;
  accessibilityNeeds: string;
  dietaryNeeds: string;
  customAnswers: Record<string, string>;
}

const STEPS = ["Tickets", "Your details", "Attendees", "Review & pay"] as const;

export default function BookingWizard({ event, categories, questions }: { event: EventInfo; categories: Category[]; questions: Question[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [attendees, setAttendees] = useState<AttendeeForm[]>([]);
  const [discountCode, setDiscountCode] = useState("");
  const [discountResult, setDiscountResult] = useState<{ valid: boolean; reason?: string; discountAmount?: number } | null>(null);
  const [discountChecking, setDiscountChecking] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedItems = useMemo(
    () => Object.entries(quantities).filter(([, qty]) => qty > 0).map(([id, qty]) => ({ category: categories.find((c) => c.id === id)!, qty })),
    [quantities, categories]
  );
  const totalTickets = selectedItems.reduce((s, i) => s + i.qty, 0);
  const subtotal = selectedItems.reduce((s, i) => s + i.category.price * i.qty, 0);
  const discountAmount = discountResult?.valid ? discountResult.discountAmount ?? 0 : 0;
  const feeAmount = subtotal - discountAmount > 0 ? Math.round((subtotal - discountAmount) * 0.03) + 10000 : 0;
  const total = Math.max(0, subtotal - discountAmount + feeAmount);

  function setQty(categoryId: string, qty: number) {
    setQuantities((q) => ({ ...q, [categoryId]: Math.max(0, qty) }));
  }

  function goToAttendeesStep() {
    // (Re)build attendee forms to match selected quantities, preserving any already-entered data.
    const next: AttendeeForm[] = [];
    for (const { category, qty } of selectedItems) {
      for (let i = 0; i < qty; i++) {
        const existing = attendees.find((a, idx) => a.ticketCategoryId === category.id && next.filter((n) => n.ticketCategoryId === category.id).length === idx);
        next.push(
          existing ?? {
            ticketCategoryId: category.id,
            fullName: "",
            email: "",
            phone: "",
            dateOfBirth: "",
            gender: "",
            idNumber: "",
            emergencyContact: "",
            accessibilityNeeds: "",
            dietaryNeeds: "",
            customAnswers: {},
          }
        );
      }
    }
    setAttendees(next);
    setStep(2);
  }

  function updateAttendee(index: number, patch: Partial<AttendeeForm>) {
    setAttendees((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  function copyBuyerToFirst() {
    if (attendees.length === 0) return;
    updateAttendee(0, { fullName: buyerName, email: buyerEmail, phone: buyerPhone });
  }

  async function applyDiscount() {
    if (!discountCode.trim()) return;
    setDiscountChecking(true);
    const result = await checkDiscountCodeAction({
      code: discountCode,
      eventId: event.id,
      ticketCategoryIds: selectedItems.map((i) => i.category.id),
      buyerEmail: buyerEmail || "guest@example.com",
      subtotal,
    });
    setDiscountResult(result);
    setDiscountChecking(false);
  }

  async function submitBooking() {
    setSubmitting(true);
    setError(null);
    const result = await createBookingAction({
      eventId: event.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      attendees: attendees.map((a) => ({
        ticketCategoryId: a.ticketCategoryId,
        fullName: a.fullName,
        email: a.email || undefined,
        phone: a.phone || undefined,
        dateOfBirth: a.dateOfBirth || undefined,
        gender: a.gender || undefined,
        idNumber: a.idNumber || undefined,
        emergencyContact: a.emergencyContact || undefined,
        accessibilityNeeds: a.accessibilityNeeds || undefined,
        dietaryNeeds: a.dietaryNeeds || undefined,
        customAnswers: a.customAnswers,
      })),
      discountCode: discountResult?.valid ? discountCode : undefined,
      termsAccepted,
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.push(`/checkout/${result.bookingId}/pay`);
  }

  return (
    <Container className="py-10">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Booking tickets for</p>
        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
      </div>

      <div className="flex items-center gap-2 mb-8 text-sm font-medium">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs ${i <= step ? "bg-brand text-white" : "bg-gray-200 text-gray-500"}`}>
              {i + 1}
            </div>
            <span className={i <= step ? "text-gray-900" : "text-gray-400"}>{label}</span>
            {i < STEPS.length - 1 && <span className="w-6 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
            {error && <div className="mb-4"><Alert variant="error">{error}</Alert></div>}

            {step === 0 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-4">Select your tickets</h2>
                <div className="space-y-4">
                  {categories.map((c) => {
                    const soldOut = c.status !== "ACTIVE" || c.remaining <= 0;
                    return (
                      <div key={c.id} className="border border-gray-200 rounded-lg p-4 flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{c.name}</p>
                            {soldOut && <Badge color="red">Sold out</Badge>}
                            {!soldOut && c.remaining <= 10 && <Badge color="amber">Almost sold out</Badge>}
                          </div>
                          {c.description && <p className="text-sm text-gray-500 mt-0.5">{c.description}</p>}
                          {c.benefits && <p className="text-xs text-gray-400 mt-0.5">{c.benefits}</p>}
                          <p className="text-sm font-semibold text-gray-900 mt-1">{c.price === 0 ? "Free" : formatMoney(c.price, c.currency)}</p>
                          <p className="text-xs text-gray-400">Limit {c.minPerOrder}–{c.maxPerOrder} per order · {c.remaining} remaining</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={soldOut || (quantities[c.id] ?? 0) <= 0}
                            onClick={() => setQty(c.id, (quantities[c.id] ?? 0) - 1)}
                            className="h-8 w-8 rounded-full border border-gray-300 disabled:opacity-30"
                          >
                            −
                          </button>
                          <span className="w-6 text-center font-semibold">{quantities[c.id] ?? 0}</span>
                          <button
                            type="button"
                            disabled={soldOut || (quantities[c.id] ?? 0) >= Math.min(c.maxPerOrder, c.remaining)}
                            onClick={() => setQty(c.id, (quantities[c.id] ?? 0) + 1)}
                            className="h-8 w-8 rounded-full border border-gray-300 disabled:opacity-30"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-end">
                  <Button disabled={totalTickets === 0} onClick={() => setStep(1)}>
                    Continue ({totalTickets} ticket{totalTickets === 1 ? "" : "s"})
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-4">Buyer contact information</h2>
                <p className="text-sm text-gray-500 mb-4">We&apos;ll send your booking confirmation and tickets to this email address.</p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="buyerName">Full name</Label>
                    <Input id="buyerName" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="buyerEmail">Email address</Label>
                    <Input id="buyerEmail" type="email" value={buyerEmail} onChange={(e) => setBuyerEmail(e.target.value)} required />
                  </div>
                  <div>
                    <Label htmlFor="buyerPhone">Phone number</Label>
                    <Input id="buyerPhone" type="tel" value={buyerPhone} onChange={(e) => setBuyerPhone(e.target.value)} required />
                  </div>
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                  <Button disabled={!buyerName || !buyerEmail || !buyerPhone} onClick={goToAttendeesStep}>
                    Continue to attendees
                  </Button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-1">Attendee details</h2>
                <p className="text-sm text-gray-500 mb-4">Enter details for each of the {attendees.length} attendee(s) on this booking.</p>
                <div className="space-y-6">
                  {attendees.map((a, idx) => {
                    const category = categories.find((c) => c.id === a.ticketCategoryId)!;
                    return (
                      <div key={idx} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <p className="font-semibold text-gray-900">Attendee {idx + 1} — {category.name}</p>
                          {idx === 0 && (
                            <button type="button" onClick={copyBuyerToFirst} className="text-xs text-brand font-semibold">
                              Copy my info
                            </button>
                          )}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Full name</Label>
                            <Input value={a.fullName} onChange={(e) => updateAttendee(idx, { fullName: e.target.value })} required />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input type="email" value={a.email} onChange={(e) => updateAttendee(idx, { email: e.target.value })} />
                          </div>
                          <div>
                            <Label>Phone</Label>
                            <Input value={a.phone} onChange={(e) => updateAttendee(idx, { phone: e.target.value })} />
                          </div>
                          <div>
                            <Label>Date of birth</Label>
                            <Input type="date" value={a.dateOfBirth} onChange={(e) => updateAttendee(idx, { dateOfBirth: e.target.value })} />
                          </div>
                          <div>
                            <Label>Emergency contact</Label>
                            <Input value={a.emergencyContact} onChange={(e) => updateAttendee(idx, { emergencyContact: e.target.value })} />
                          </div>
                          <div>
                            <Label>Dietary requirements</Label>
                            <Input value={a.dietaryNeeds} onChange={(e) => updateAttendee(idx, { dietaryNeeds: e.target.value })} />
                          </div>
                          <div>
                            <Label>Accessibility requirements</Label>
                            <Input value={a.accessibilityNeeds} onChange={(e) => updateAttendee(idx, { accessibilityNeeds: e.target.value })} />
                          </div>
                          {questions.map((q) => (
                            <div key={q.id}>
                              <Label>{q.label}{q.required && " *"}</Label>
                              {q.type === "SELECT" ? (
                                <Select
                                  value={a.customAnswers[q.id] ?? ""}
                                  required={q.required}
                                  onChange={(e) => updateAttendee(idx, { customAnswers: { ...a.customAnswers, [q.id]: e.target.value } })}
                                >
                                  <option value="">Select...</option>
                                  {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
                                </Select>
                              ) : (
                                <Input
                                  required={q.required}
                                  value={a.customAnswers[q.id] ?? ""}
                                  onChange={(e) => updateAttendee(idx, { customAnswers: { ...a.customAnswers, [q.id]: e.target.value } })}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                  <Button disabled={attendees.some((a) => !a.fullName)} onClick={() => setStep(3)}>
                    Review order
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-bold text-gray-900 mb-4">Review your order</h2>
                <div className="space-y-2 mb-5">
                  {attendees.map((a, idx) => {
                    const category = categories.find((c) => c.id === a.ticketCategoryId)!;
                    return (
                      <div key={idx} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                        <span>{a.fullName || "—"} <span className="text-gray-400">({category.name})</span></span>
                        <span className="font-medium">{formatMoney(category.price, category.currency)}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2 mb-5">
                  <Input placeholder="Discount code" value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} />
                  <Button type="button" variant="secondary" onClick={applyDiscount} disabled={discountChecking || !discountCode}>
                    {discountChecking ? "Checking..." : "Apply"}
                  </Button>
                </div>
                {discountResult && (
                  <div className="mb-5">
                    {discountResult.valid ? (
                      <Alert variant="success">Discount applied: −{formatMoney(discountResult.discountAmount ?? 0)}</Alert>
                    ) : (
                      <Alert variant="error">{discountResult.reason}</Alert>
                    )}
                  </div>
                )}

                <div className="border-t border-gray-200 pt-4 space-y-1 text-sm mb-5">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(subtotal)}</span></div>
                  {discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatMoney(discountAmount)}</span></div>}
                  {feeAmount > 0 && <div className="flex justify-between"><span className="text-gray-500">Service fee</span><span>{formatMoney(feeAmount)}</span></div>}
                  <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-200"><span>Total</span><span>{total === 0 ? "Free" : formatMoney(total)}</span></div>
                </div>

                <Alert variant="info">
                  Refund policy: {event.refundPolicy} Refunds close 48 hours before the event begins.
                </Alert>

                <label className="flex items-start gap-2 mt-4 text-sm text-gray-700">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="mt-1" />
                  I have read and accept the event terms and conditions and refund policy.
                </label>

                <div className="mt-6 flex justify-between">
                  <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
                  <Button disabled={!termsAccepted || submitting} onClick={submitBooking}>
                    {submitting ? "Processing..." : total === 0 ? "Confirm free booking" : "Continue to payment"}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card className="p-6 sticky top-24">
            <h3 className="font-semibold text-gray-900 mb-3">Order summary</h3>
            {selectedItems.length === 0 ? (
              <p className="text-sm text-gray-400">No tickets selected yet.</p>
            ) : (
              <div className="space-y-2 text-sm mb-4">
                {selectedItems.map(({ category, qty }) => (
                  <div key={category.id} className="flex justify-between">
                    <span>{qty} × {category.name}</span>
                    <span>{formatMoney(category.price * qty, category.currency)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between font-bold">
              <span>Total</span>
              <span>{total === 0 ? "Free" : formatMoney(total)}</span>
            </div>
          </Card>
        </div>
      </div>
    </Container>
  );
}

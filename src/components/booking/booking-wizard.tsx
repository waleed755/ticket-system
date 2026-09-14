"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Card, Button, Input, Label, Alert, Badge } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { createBookingAction, checkDiscountCodeAction } from "@/app/actions/booking";
import CheckoutSteps from "./checkout-steps";

interface Category {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  minPerOrder: number;
  maxPerOrder: number;
  status: string;
  remaining: number;
  benefits: string | null;
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

export default function BookingWizard({ event, categories }: { event: EventInfo; categories: Category[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
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
  const total = Math.max(0, subtotal - discountAmount);

  function setQty(categoryId: string, qty: number) {
    setQuantities((q) => ({ ...q, [categoryId]: Math.max(0, qty) }));
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

  async function reviewOrder() {
    setSubmitting(true);
    setError(null);
    // Tickets are issued to the buyer — each still gets its own unique ticket
    // number/QR code, but no separate per-attendee details are collected.
    const attendees = selectedItems.flatMap(({ category, qty }) =>
      Array.from({ length: qty }, () => ({
        ticketCategoryId: category.id,
        fullName: buyerName,
        email: buyerEmail,
        phone: buyerPhone,
      }))
    );
    const result = await createBookingAction({
      eventId: event.id,
      buyerName,
      buyerEmail,
      buyerPhone,
      attendees,
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

  const detailsComplete = !!buyerName && !!buyerEmail && !!buyerPhone && termsAccepted;

  return (
    <Container className="py-10">
      <div className="mb-8">
        <p className="text-sm text-gray-500 mb-1">Booking tickets for</p>
        <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
      </div>

      <CheckoutSteps current={step === 0 ? 1 : 2} />

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
                          </div>
                          {c.description && <p className="text-sm text-gray-500 mt-0.5">{c.description}</p>}
                          {c.benefits && <p className="text-xs text-gray-400 mt-0.5">{c.benefits}</p>}
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {c.price === 0 ? (
                              "Free"
                            ) : c.compareAtPrice && c.compareAtPrice > c.price ? (
                              <>
                                <span className="line-through text-gray-400 font-normal mr-1">{formatMoney(c.compareAtPrice, c.currency)}</span>
                                <span className="text-brand-pink">{formatMoney(c.price, c.currency)}</span>
                              </>
                            ) : (
                              formatMoney(c.price, c.currency)
                            )}
                          </p>
                          <p className="text-xs text-gray-400">Limit {c.minPerOrder}–{c.maxPerOrder} per order</p>
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
                <h2 className="font-bold text-gray-900 mb-1">Customer & booking details</h2>
                <p className="text-sm text-gray-500 mb-4">
                  We&apos;ll send your booking confirmation and tickets to this email address. Tickets are issued to
                  you and each carries its own unique code.
                </p>
                <div className="space-y-4 mb-8">
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

                <h3 className="font-bold text-gray-900 mb-3">Order summary</h3>
                <div className="space-y-2 mb-5">
                  {selectedItems.map(({ category, qty }) => (
                    <div key={category.id} className="flex justify-between text-sm border-b border-gray-100 pb-2">
                      <span>{qty} × {category.name}</span>
                      <span className="font-medium">{formatMoney(category.price * qty, category.currency)}</span>
                    </div>
                  ))}
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
                  <Button variant="secondary" onClick={() => setStep(0)}>Back</Button>
                  <Button disabled={!detailsComplete || submitting} onClick={reviewOrder}>
                    {submitting ? "Processing..." : "Review Order"}
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

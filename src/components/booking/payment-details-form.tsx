"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Card, Button, Alert } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { submitPaymentProofAction } from "@/app/actions/booking";
import { uploadPaymentProofFile } from "@/lib/upload-client";

const WHATSAPP_NUMBER_DISPLAY = "0347 6581443";
const WHATSAPP_LINK = "https://wa.me/923476581443";

function useCountdown(expiresAt: string | null) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((target - Date.now()) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return remaining;
}

export default function PaymentDetailsForm({
  bookingId,
  totalAmount,
  currency,
  reservationExpiresAt,
  accountDetails,
  qrImageUrl,
}: {
  bookingId: string;
  totalAmount: number;
  currency: string;
  reservationExpiresAt: string | null;
  accountDetails: string;
  qrImageUrl: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const remaining = useCountdown(reservationExpiresAt);
  const expired = remaining !== null && remaining <= 0;

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadPaymentProofFile(bookingId, file);
      setProofUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!proofUrl) return;
    setSubmitting(true);
    setError(null);
    const result = await submitPaymentProofAction({ bookingId, proofImageUrl: proofUrl });
    if (!result.ok) {
      setSubmitting(false);
      setError(result.reason);
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-6">
      {remaining !== null && !expired && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-5">
          Your tickets are reserved for {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")} more minutes.
        </p>
      )}
      {expired && <div className="mb-5"><Alert variant="error">Your reservation expired. Please go back and start a new booking.</Alert></div>}
      {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}

      <h2 className="font-bold text-gray-900 mb-2">Payment</h2>
      <p className="text-sm text-gray-600 mb-4">
        Please pay the total amount shown below using the account details provided. You can transfer the payment
        directly to the account or scan the QR code to pay.
      </p>

      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 mb-5 text-center">
        <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total amount</p>
        <p className="text-3xl font-bold text-gray-900">{formatMoney(totalAmount, currency)}</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Payment account details</h3>
          <div className="rounded-lg border border-gray-200 p-4 text-sm text-gray-700 whitespace-pre-line min-h-[80px]">
            {accountDetails || "Payment account details will be added shortly — please contact support before paying."}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 mb-2 uppercase tracking-wide">Payment QR code</h3>
          <div className="rounded-lg border border-gray-200 p-4 flex items-center justify-center min-h-[80px]">
            {qrImageUrl ? (
              <div className="relative w-40 h-40">
                <Image src={qrImageUrl} alt="Payment QR code" fill className="object-contain" unoptimized />
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center">QR code will be added shortly.</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 pt-5">
        <h3 className="font-bold text-gray-900 mb-1">Already paid?</h3>
        <p className="text-sm text-gray-600 mb-3">Upload Payment Screenshot</p>

        {proofUrl && (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mb-3">
            <Image src={proofUrl} alt="Payment screenshot preview" fill className="object-cover" unoptimized />
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <button
            type="button"
            disabled={uploading || expired}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {uploading ? "Uploading..." : proofUrl ? "Choose a different screenshot" : "Upload Payment Screenshot"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
        </div>

        <Button className="w-full" size="lg" disabled={!proofUrl || submitting || uploading || expired} onClick={submit}>
          {submitting ? "Submitting..." : "Submit Payment Proof"}
        </Button>

        <p className="text-xs text-gray-500 mt-3">
          Once submitted, our team will verify your payment and update your booking status. You will receive an
          email once your payment has been approved.
        </p>
      </div>

      <div className="border-t border-gray-200 mt-5 pt-4 text-sm text-gray-600">
        Need help with your payment?{" "}
        <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="text-brand font-semibold">
          WhatsApp: {WHATSAPP_NUMBER_DISPLAY}
        </a>
      </div>
    </Card>
  );
}

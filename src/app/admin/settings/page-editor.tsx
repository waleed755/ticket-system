"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { updatePageAction, updateSiteSettingAction } from "@/app/actions/admin-settings";
import { Card, Button, Input, Label, Textarea, Alert } from "@/components/ui";
import { uploadImageFile } from "@/lib/upload-client";

export function PageEditor({ slug, title, content }: { slug: string; title: string; content: string }) {
  const [t, setT] = useState(title);
  const [c, setC] = useState(content);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Card className="p-6 space-y-3">
      <h3 className="font-semibold text-gray-900">/{slug}</h3>
      {saved && <Alert variant="success">Saved.</Alert>}
      <div><Label>Title</Label><Input value={t} onChange={(e) => setT(e.target.value)} /></div>
      <div><Label>Content</Label><Textarea rows={4} value={c} onChange={(e) => setC(e.target.value)} /></div>
      <Button
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updatePageAction(slug, t, c);
            setSaved(true);
          })
        }
      >
        {pending ? "Saving..." : "Save"}
      </Button>
    </Card>
  );
}

export function PaymentSettingsEditor({ accountDetails, qrImageUrl }: { accountDetails: string; qrImageUrl: string }) {
  const [details, setDetails] = useState(accountDetails);
  const [qrUrl, setQrUrl] = useState(qrImageUrl);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleQrFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImageFile(file);
      setQrUrl(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function save() {
    startTransition(async () => {
      await updateSiteSettingAction("payment_account_details", details);
      await updateSiteSettingAction("payment_qr_image_url", qrUrl);
      setSaved(true);
    });
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h2 className="font-semibold text-gray-900">Payment verification details</h2>
        <p className="text-sm text-gray-500 mt-1">
          Shown to customers at checkout (Step 3: Payment &amp; Confirmation) so they can pay by bank transfer or QR
          code and upload proof of payment.
        </p>
      </div>
      {saved && <Alert variant="success">Saved.</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      <div>
        <Label>Account details (bank name, account title, account number, IBAN, etc.)</Label>
        <Textarea rows={5} value={details} onChange={(e) => { setDetails(e.target.value); setSaved(false); }} />
      </div>

      <div>
        <Label>Payment QR code image</Label>
        {qrUrl && (
          <div className="relative w-40 h-40 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 mb-2">
            <Image src={qrUrl} alt="Payment QR code preview" fill className="object-contain" unoptimized />
          </div>
        )}
        <div className="flex gap-2">
          <Input value={qrUrl} onChange={(e) => { setQrUrl(e.target.value); setSaved(false); }} placeholder="Image URL, or upload a file →" className="flex-1" />
          <label className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer whitespace-nowrap">
            {uploading ? "Uploading..." : "Upload image"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleQrFile(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      </div>

      <Button size="sm" disabled={pending} onClick={save}>
        {pending ? "Saving..." : "Save"}
      </Button>
    </Card>
  );
}

export function SettingEditor({ settingKey, value }: { settingKey: string; value: string }) {
  const [v, setV] = useState(value);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Label>{settingKey.replace(/_/g, " ")}</Label>
        <Input value={v} onChange={(e) => setV(e.target.value)} />
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await updateSiteSettingAction(settingKey, v);
            setSaved(true);
          })
        }
      >
        {saved ? "Saved" : pending ? "..." : "Save"}
      </Button>
    </div>
  );
}

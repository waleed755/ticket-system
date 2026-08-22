"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createDiscountAction } from "@/app/actions/admin-discounts";
import { Card, Button, Input, Label, Select, Alert } from "@/components/ui";

export default function DiscountForm({ events }: { events: { id: string; name: string }[] }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"FIXED" | "PERCENTAGE">("PERCENTAGE");
  const [value, setValue] = useState(10);
  const [usageLimit, setUsageLimit] = useState<number | "">("");
  const [perCustomerLimit, setPerCustomerLimit] = useState<number | "">(1);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [eventIds, setEventIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    if (!code.trim()) {
      setError("Enter a code.");
      return;
    }
    startTransition(async () => {
      const result = await createDiscountAction({
        code,
        description,
        type,
        value: type === "PERCENTAGE" ? value : Math.round(value * 100),
        usageLimit: usageLimit === "" ? undefined : usageLimit,
        perCustomerLimit: perCustomerLimit === "" ? undefined : perCustomerLimit,
        minOrderAmount: Math.round(minOrderAmount * 100),
        active: true,
        eventIds,
        ticketCategoryIds: [],
      });
      if (!result.ok) {
        setError("Something went wrong.");
        return;
      }
      router.push("/admin/discounts");
      router.refresh();
    });
  }

  return (
    <Card className="p-6 space-y-4 max-w-xl">
      {error && <Alert variant="error">{error}</Alert>}
      <div>
        <Label>Code</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER20" />
      </div>
      <div>
        <Label>Description</Label>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Discount type</Label>
          <Select value={type} onChange={(e) => setType(e.target.value as "FIXED" | "PERCENTAGE")}>
            <option value="PERCENTAGE">Percentage</option>
            <option value="FIXED">Fixed amount</option>
          </Select>
        </div>
        <div>
          <Label>{type === "PERCENTAGE" ? "Percent off" : "Amount off (PKR)"}</Label>
          <Input type="number" value={value} onChange={(e) => setValue(Number(e.target.value))} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><Label>Total usage limit</Label><Input type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Unlimited" /></div>
        <div><Label>Per-customer limit</Label><Input type="number" value={perCustomerLimit} onChange={(e) => setPerCustomerLimit(e.target.value === "" ? "" : Number(e.target.value))} placeholder="Unlimited" /></div>
      </div>
      <div><Label>Minimum order amount (PKR)</Label><Input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(Number(e.target.value))} /></div>
      <div>
        <Label>Applicable events (none selected = all events)</Label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 space-y-1">
          {events.map((e) => (
            <label key={e.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={eventIds.includes(e.id)}
                onChange={(ev) => setEventIds(ev.target.checked ? [...eventIds, e.id] : eventIds.filter((id) => id !== e.id))}
              />
              {e.name}
            </label>
          ))}
        </div>
      </div>
      <Button disabled={pending} onClick={submit}>{pending ? "Creating..." : "Create discount code"}</Button>
    </Card>
  );
}

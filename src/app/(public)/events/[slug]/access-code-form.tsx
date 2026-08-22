"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input, Label, Card } from "@/components/ui";

export default function AccessCodeForm({ slug }: { slug: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");

  return (
    <Card className="max-w-md mx-auto mt-16 p-8 text-center">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Private event</h1>
      <p className="text-sm text-gray-600 mb-6">This event is private. Enter the access code you were given to view details and book tickets.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          router.push(`/events/${slug}?code=${encodeURIComponent(code)}`);
        }}
        className="space-y-4 text-left"
      >
        <div>
          <Label htmlFor="code">Access code</Label>
          <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="e.g. FOUNDERS26" required />
        </div>
        <Button type="submit" className="w-full">Unlock event</Button>
      </form>
    </Card>
  );
}

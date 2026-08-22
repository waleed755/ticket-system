"use client";

import { useState, useTransition } from "react";
import { updatePageAction, updateSiteSettingAction } from "@/app/actions/admin-settings";
import { Card, Button, Input, Label, Textarea, Alert } from "@/components/ui";

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

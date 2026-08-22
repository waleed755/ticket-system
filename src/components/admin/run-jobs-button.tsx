"use client";

import { useState, useTransition } from "react";
import { runScheduledJobsAction } from "@/app/actions/admin-jobs";
import { Button, Alert } from "@/components/ui";

export default function RunJobsButton() {
  const [result, setResult] = useState<{ releasedHolds: number; schedulesFired: number; emailsSent: number } | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await runScheduledJobsAction();
            setResult(res);
          })
        }
      >
        {pending ? "Running..." : "Run scheduled jobs now"}
      </Button>
      {result && (
        <div className="mt-2">
          <Alert variant="success">
            Released {result.releasedHolds} expired hold(s) · Fired {result.schedulesFired} reminder schedule(s) · Sent {result.emailsSent} reminder email(s)
          </Alert>
        </div>
      )}
    </div>
  );
}

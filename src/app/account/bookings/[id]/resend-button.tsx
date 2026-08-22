"use client";

import { useState, useTransition } from "react";
import { resendTicketsAction } from "@/app/actions/account";
import { Button } from "@/components/ui";

export default function ResendButton({ bookingId }: { bookingId: string }) {
  const [sent, setSent] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      size="sm"
      disabled={pending || sent}
      onClick={() =>
        startTransition(async () => {
          await resendTicketsAction(bookingId);
          setSent(true);
        })
      }
    >
      {sent ? "Sent!" : pending ? "Sending..." : "Resend tickets by email"}
    </Button>
  );
}

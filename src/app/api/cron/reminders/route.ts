import { NextResponse } from "next/server";
import { processReminders } from "@/lib/reminders";
import { releaseExpiredHolds } from "@/lib/inventory";

// Intended to be hit periodically by an external scheduler in production.
// Also invoked directly by the admin "Run scheduled jobs now" action.
export async function GET() {
  const releasedHolds = await releaseExpiredHolds();
  const reminders = await processReminders();
  return NextResponse.json({ releasedHolds, ...reminders });
}

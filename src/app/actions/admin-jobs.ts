"use server";

import { requireRole } from "@/lib/auth";
import { processReminders } from "@/lib/reminders";
import { releaseExpiredHolds } from "@/lib/inventory";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";

export async function runScheduledJobsAction() {
  const session = await requireRole(["ADMIN"]);
  const releasedHolds = await releaseExpiredHolds();
  const { schedulesFired, emailsSent } = await processReminders();

  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "jobs.run",
    entityType: "SYSTEM",
    description: `Ran scheduled jobs: released ${releasedHolds} expired hold(s), fired ${schedulesFired} reminder schedule(s), sent ${emailsSent} reminder email(s).`,
  });

  revalidatePath("/admin");
  return { ok: true as const, releasedHolds, schedulesFired, emailsSent };
}

import { prisma } from "./prisma";
import { sendEmail, emailTemplates } from "./email";

// No long-running process exists in this environment to fire reminders on a
// timer, so this is invoked two ways: an admin "Run scheduled jobs now"
// button, and a /api/cron/reminders route a real external scheduler (e.g. a
// hosting platform's cron trigger) can hit periodically in production.
export async function processReminders(): Promise<{ schedulesFired: number; emailsSent: number }> {
  const now = new Date();
  const dueSchedules = await prisma.reminderSchedule.findMany({
    where: { enabled: true, lastRunAt: null },
    include: { event: true },
  });

  let schedulesFired = 0;
  let emailsSent = 0;

  for (const schedule of dueSchedules) {
    const fireAt = new Date(schedule.event.startAt.getTime() - schedule.offsetHoursBefore * 60 * 60 * 1000);
    if (now < fireAt) continue;
    if (schedule.event.status !== "PUBLISHED" && schedule.event.status !== "PAUSED") continue;
    if (now >= schedule.event.startAt) continue;

    const bookings = await prisma.booking.findMany({
      where: { eventId: schedule.eventId, status: { in: ["CONFIRMED", "PARTIALLY_REFUNDED"] } },
    });

    for (const booking of bookings) {
      await sendEmail({
        toEmail: booking.buyerEmail,
        subject: `Reminder: ${schedule.event.name} is coming up`,
        bodyHtml: emailTemplates.reminder({
          buyerName: booking.buyerName,
          eventName: schedule.event.name,
          date: new Intl.DateTimeFormat("en-US", { dateStyle: "full", timeStyle: "short", timeZone: schedule.event.timezone }).format(schedule.event.startAt),
          venue: schedule.event.format === "ONLINE" ? "Online event" : `${schedule.event.venueName ?? ""}${schedule.event.city ? `, ${schedule.event.city}` : ""}`,
          directions: schedule.event.mapUrl ?? schedule.event.onlineInstructions ?? "",
          bookingUrl: `${process.env.APP_URL}/account/bookings/${booking.id}`,
          label: schedule.label,
        }),
        previewText: `${schedule.label}: ${schedule.event.name}`,
        category: "EVENT_REMINDER",
        relatedBookingId: booking.id,
        relatedEventId: schedule.eventId,
      });
      emailsSent++;
    }

    await prisma.reminderSchedule.update({ where: { id: schedule.id }, data: { lastRunAt: now } });
    schedulesFired++;
  }

  return { schedulesFired, emailsSent };
}

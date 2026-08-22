import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, EmptyState } from "@/components/ui";
import AnnouncementForm from "./announcement-form";

export const dynamic = "force-dynamic";

export default async function AdminCommunicationsPage() {
  const [events, emailLogs] = await Promise.all([
    prisma.event.findMany({ include: { ticketCategories: true }, orderBy: { startAt: "asc" } }),
    prisma.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  return (
    <div className="space-y-8">
      <SectionHeading title="Emails & announcements" description="Send updates to attendees and review outgoing mail." />
      <AnnouncementForm events={events.map((e) => ({ id: e.id, name: e.name, ticketCategories: e.ticketCategories.map((c) => ({ id: c.id, name: c.name })) }))} />

      <div>
        <h2 className="font-semibold text-gray-900 mb-4">Recent email activity (simulated outbox)</h2>
        {emailLogs.length === 0 ? (
          <Card className="p-0"><EmptyState title="No emails sent yet" /></Card>
        ) : (
          <div className="space-y-2">
            {emailLogs.map((e) => (
              <Card key={e.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{e.subject}</p>
                  <p className="text-xs text-gray-400">To: {e.toEmail} · {e.createdAt.toLocaleString()}</p>
                </div>
                <Badge color="indigo">{e.category.replace(/_/g, " ")}</Badge>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

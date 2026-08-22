import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, EmptyState } from "@/components/ui";
import NotifyButton from "./notify-button";

export const dynamic = "force-dynamic";

export default async function AdminWaitlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) notFound();

  const entries = await prisma.waitlistEntry.findMany({ where: { eventId: id }, include: { ticketCategory: true }, orderBy: { createdAt: "asc" } });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading title={`Waiting list — ${event.name}`} description={`${entries.length} entries`} />
        <a href={`/api/events/${id}/waitlist/export`} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50">Export CSV</a>
      </div>
      {entries.length === 0 ? (
        <Card className="p-0"><EmptyState title="No one on the waiting list yet" /></Card>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Category</th><th className="px-4 py-2">Joined</th><th className="px-4 py-2">Status</th><th className="px-4 py-2"></th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {entries.map((e) => (
                <tr key={e.id}>
                  <td className="px-4 py-2 font-medium">{e.name}</td>
                  <td className="px-4 py-2 text-gray-500">{e.email}</td>
                  <td className="px-4 py-2">{e.ticketCategory?.name ?? "Any"}</td>
                  <td className="px-4 py-2 text-xs text-gray-400">{e.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-2"><Badge color={e.status === "WAITING" ? "amber" : "green"}>{e.status}</Badge></td>
                  <td className="px-4 py-2"><NotifyButton entryId={e.id} status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

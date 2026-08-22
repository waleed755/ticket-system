import { prisma } from "@/lib/prisma";
import { Card, SectionHeading, EmptyState, Select } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage({ searchParams }: { searchParams: Promise<{ entityType?: string }> }) {
  const { entityType } = await searchParams;
  const logs = await prisma.activityLog.findMany({
    where: entityType ? { entityType } : {},
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  const entityTypes = ["EVENT", "BOOKING", "TICKET", "REFUND", "DISCOUNT_CODE", "USER", "SYSTEM"];

  return (
    <div>
      <SectionHeading title="Administrative activity log" description={`${logs.length} entries`} />
      <form className="mb-6">
        <Select name="entityType" defaultValue={entityType ?? ""} className="max-w-xs">
          <option value="">All types</option>
          {entityTypes.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
      </form>
      {logs.length === 0 ? (
        <Card className="p-0"><EmptyState title="No activity recorded yet" /></Card>
      ) : (
        <div className="space-y-2">
          {logs.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-900">{l.description}</p>
                <span className="text-xs text-gray-400">{l.createdAt.toLocaleString()}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{l.actorName} · {l.action} · {l.entityType}</p>
              {l.reason && <p className="text-xs text-amber-700 mt-1">Reason: {l.reason}</p>}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

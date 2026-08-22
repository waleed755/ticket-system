import { prisma } from "@/lib/prisma";
import { Card, SectionHeading, EmptyState } from "@/components/ui";
import StatusSelect from "./status-select";

export const dynamic = "force-dynamic";

export default async function ContactMessagesPage() {
  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <SectionHeading title="Contact messages" description={`${messages.length} message(s) from the public contact form`} />
      {messages.length === 0 ? (
        <Card className="p-0"><EmptyState title="No messages yet" /></Card>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card key={m.id} className="p-4">
              <div className="flex items-center justify-between mb-1">
                <p className="font-semibold text-gray-900">{m.subject}</p>
                <StatusSelect id={m.id} status={m.status} />
              </div>
              <p className="text-sm text-gray-500">{m.name} · {m.email} · {m.createdAt.toLocaleString()}</p>
              <p className="text-sm text-gray-700 mt-2">{m.message}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

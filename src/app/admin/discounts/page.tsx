import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, EmptyState, LinkButton } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import ToggleButton from "./toggle-button";

export const dynamic = "force-dynamic";

export default async function AdminDiscountsPage() {
  const codes = await prisma.discountCode.findMany({
    include: { eventLinks: { include: { event: true } }, categoryLinks: { include: { ticketCategory: true } }, _count: { select: { redemptions: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading title="Discount codes" description={`${codes.length} code(s)`} />
        <LinkButton href="/admin/discounts/new">Create code</LinkButton>
      </div>

      {codes.length === 0 ? (
        <Card className="p-0"><EmptyState title="No discount codes yet" /></Card>
      ) : (
        <div className="grid gap-4">
          {codes.map((c) => (
            <Card key={c.id} className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-gray-900">{c.code}</p>
                    <Badge color={c.active ? "green" : "gray"}>{c.active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {c.type === "PERCENTAGE" ? `${c.value}% off` : `${formatMoney(c.value)} off`} ·
                    {" "}{c.eventLinks.length ? c.eventLinks.map((l) => l.event.name).join(", ") : "All events"} ·
                    {" "}Used {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ""} times
                  </p>
                </div>
                <ToggleButton id={c.id} active={c.active} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

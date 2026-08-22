import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { refundStatusColor, formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

export default async function AdminRefundsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "PENDING" } = await searchParams;
  const refunds = await prisma.refund.findMany({
    where: status === "ALL" ? {} : { status: status as never },
    include: { booking: { include: { event: true } }, ticketLinks: { include: { ticket: { include: { attendee: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const tabs = ["PENDING", "APPROVED", "PARTIALLY_APPROVED", "COMPLETED", "REJECTED", "ALL"];

  return (
    <div>
      <SectionHeading title="Refund requests" description={`${refunds.length} shown`} />
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <Link key={t} href={`/admin/refunds?status=${t}`} className={`px-3 py-1 rounded-full text-xs font-semibold ${status === t ? "bg-brand text-white" : "bg-white border border-gray-200"}`}>
            {t === "ALL" ? "All" : formatStatusLabel(t)}
          </Link>
        ))}
      </div>

      {refunds.length === 0 ? (
        <Card className="p-0"><EmptyState title="No refund requests" /></Card>
      ) : (
        <div className="space-y-3">
          {refunds.map((r) => (
            <Link key={r.id} href={`/admin/refunds/${r.id}`}>
              <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold text-gray-900">{r.booking.event.name}</p>
                  <p className="text-sm text-gray-500">{r.booking.bookingNumber} · {r.booking.buyerName} · {r.ticketLinks.map((l) => l.ticket.attendee.fullName).join(", ")}</p>
                  <p className="text-xs text-gray-400 mt-1">{r.reason}</p>
                </div>
                <div className="text-right">
                  <Badge color={refundStatusColor[r.status]}>{formatStatusLabel(r.status)}</Badge>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatMoney(r.requestedAmount, r.booking.currency)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

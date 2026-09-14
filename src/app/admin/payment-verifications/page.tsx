import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, EmptyState } from "@/components/ui";
import { formatMoney } from "@/lib/money";
import { formatStatusLabel } from "@/lib/booking-status";

export const dynamic = "force-dynamic";

const paymentStatusColor: Record<string, "gray" | "green" | "red" | "amber"> = {
  AWAITING_VERIFICATION: "amber",
  SUCCEEDED: "green",
  FAILED: "red",
};

export default async function AdminPaymentVerificationsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "AWAITING_VERIFICATION" } = await searchParams;
  const payments = await prisma.payment.findMany({
    where: status === "ALL" ? { method: "manual_transfer" } : { method: "manual_transfer", status: status as never },
    include: { booking: { include: { event: true, attendees: { include: { ticketCategory: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  const tabs = ["AWAITING_VERIFICATION", "SUCCEEDED", "FAILED", "ALL"];

  return (
    <div>
      <SectionHeading title="Payment verifications" description={`${payments.length} shown`} />
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/payment-verifications?status=${t}`}
            className={`px-3 py-1 rounded-full text-xs font-semibold ${status === t ? "bg-brand text-white" : "bg-white border border-gray-200"}`}
          >
            {t === "ALL" ? "All" : formatStatusLabel(t)}
          </Link>
        ))}
      </div>

      {payments.length === 0 ? (
        <Card className="p-0"><EmptyState title="No payment proofs here" /></Card>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <Link key={p.id} href={`/admin/payment-verifications/${p.id}`}>
              <Card className="p-4 flex items-center justify-between hover:shadow-md transition-shadow">
                <div>
                  <p className="font-semibold text-gray-900">{p.booking.event.name}</p>
                  <p className="text-sm text-gray-500">
                    {p.booking.bookingNumber} · {p.booking.buyerName} ·{" "}
                    {p.booking.attendees.length} ticket(s) (
                    {[...new Set(p.booking.attendees.map((a) => a.ticketCategory.name))].join(", ")})
                  </p>
                </div>
                <div className="text-right">
                  <Badge color={paymentStatusColor[p.status] ?? "gray"}>{formatStatusLabel(p.status)}</Badge>
                  <p className="text-sm font-medium text-gray-900 mt-1">{formatMoney(p.amount, p.currency)}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

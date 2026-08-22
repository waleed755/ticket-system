import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getScopedEventIds } from "@/lib/admin-scope";
import { Card, SectionHeading } from "@/components/ui";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const session = await getSession();
  const scoped = await getScopedEventIds(session!);
  const eventFilter = scoped === "ALL" ? {} : { id: { in: scoped } };

  const events = await prisma.event.findMany({
    where: eventFilter,
    include: {
      ticketCategories: true,
      tickets: { include: { booking: true } },
      _count: { select: { bookings: true } },
    },
  });

  const salesByEvent = events
    .map((e) => {
      const validTickets = e.tickets.filter((t) => ["VALID", "CHECKED_IN", "REFUNDED"].includes(t.status));
      const revenue = validTickets.reduce((s, t) => s + (t.status === "REFUNDED" ? 0 : t.price), 0);
      const checkedIn = e.tickets.filter((t) => t.status === "CHECKED_IN").length;
      const totalIssued = e.tickets.filter((t) => t.status !== "CANCELLED" && t.status !== "EXPIRED").length;
      return { name: e.name, revenue, ticketsSold: validTickets.length, checkedIn, attendanceRate: totalIssued > 0 ? (checkedIn / totalIssued) * 100 : 0 };
    })
    .sort((a, b) => b.revenue - a.revenue);

  const categoryBreakdown = await prisma.ticketCategory.findMany({
    where: { event: eventFilter },
    include: { event: true },
    orderBy: { quantitySold: "desc" },
    take: 10,
  });

  const payments = await prisma.payment.groupBy({
    by: ["status"],
    where: { booking: scoped === "ALL" ? {} : { eventId: { in: scoped } } },
    _count: true,
    _sum: { amount: true },
  });

  const refunds = await prisma.refund.groupBy({
    by: ["status"],
    where: { booking: scoped === "ALL" ? {} : { eventId: { in: scoped } } },
    _count: true,
  });

  const discountUsage = await prisma.discountCode.findMany({
    where: { usedCount: { gt: 0 } },
    orderBy: { usedCount: "desc" },
    take: 10,
  });

  const totalTicketsAllTime = await prisma.ticket.count({ where: { event: eventFilter, status: { not: "CANCELLED" } } });
  const freeTickets = await prisma.ticket.count({ where: { event: eventFilter, price: 0, status: { not: "CANCELLED" } } });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionHeading title="Reports & analytics" />
        <a href="/api/reports/export" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50 h-fit">Download sales report (CSV)</a>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Sales by event</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-gray-500">
            <tr><th className="py-2">Event</th><th className="py-2">Revenue</th><th className="py-2">Tickets sold</th><th className="py-2">Attendance rate</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {salesByEvent.map((s) => (
              <tr key={s.name}>
                <td className="py-2 font-medium">{s.name}</td>
                <td className="py-2">{formatMoney(s.revenue)}</td>
                <td className="py-2">{s.ticketsSold}</td>
                <td className="py-2">{s.attendanceRate.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Top ticket categories</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Category</th><th className="py-2">Event</th><th className="py-2">Sold</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {categoryBreakdown.map((c) => (
                <tr key={c.id}><td className="py-2">{c.name}</td><td className="py-2 text-gray-500">{c.event.name}</td><td className="py-2">{c.quantitySold}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Payments</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Status</th><th className="py-2">Count</th><th className="py-2">Total</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {payments.map((p) => (
                <tr key={p.status}><td className="py-2">{p.status}</td><td className="py-2">{p._count}</td><td className="py-2">{formatMoney(p._sum.amount ?? 0)}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Refund requests</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Status</th><th className="py-2">Count</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {refunds.map((r) => (
                <tr key={r.status}><td className="py-2">{r.status}</td><td className="py-2">{r._count}</td></tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Discount code usage</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-gray-500"><tr><th className="py-2">Code</th><th className="py-2">Used</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {discountUsage.map((d) => (
                <tr key={d.id}><td className="py-2 font-mono">{d.code}</td><td className="py-2">{d.usedCount}</td></tr>
              ))}
              {discountUsage.length === 0 && <tr><td className="py-2 text-gray-400" colSpan={2}>No discount codes used yet.</td></tr>}
            </tbody>
          </table>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="font-semibold text-gray-900 mb-2">Free vs. paid tickets</h2>
        <p className="text-sm text-gray-600">{freeTickets} free · {totalTicketsAllTime - freeTickets} paid · {totalTicketsAllTime} total</p>
      </Card>
    </div>
  );
}

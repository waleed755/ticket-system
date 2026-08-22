import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui";
import ManualBookingForm from "./manual-booking-form";

export default async function ManualBookingPage() {
  const events = await prisma.event.findMany({
    where: { status: { in: ["PUBLISHED", "PAUSED", "DRAFT"] } },
    include: { ticketCategories: true },
    orderBy: { startAt: "asc" },
  });

  return (
    <div>
      <SectionHeading title="Create manual booking" description="Add a booking directly, e.g. for a comp guest or an offline sale." />
      <ManualBookingForm events={events.map((e) => ({ id: e.id, name: e.name, ticketCategories: e.ticketCategories.map((c) => ({ id: c.id, name: c.name })) }))} />
    </div>
  );
}

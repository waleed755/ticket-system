import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui";
import DiscountForm from "./discount-form";

export default async function NewDiscountPage() {
  const events = await prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startAt: "asc" } });
  return (
    <div>
      <SectionHeading title="Create discount code" />
      <DiscountForm events={events} />
    </div>
  );
}

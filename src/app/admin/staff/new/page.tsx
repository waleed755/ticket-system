import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui";
import StaffForm from "./staff-form";

export default async function NewStaffPage() {
  const events = await prisma.event.findMany({ select: { id: true, name: true }, orderBy: { startAt: "asc" } });
  return (
    <div>
      <SectionHeading title="Add staff member" />
      <StaffForm events={events} />
    </div>
  );
}

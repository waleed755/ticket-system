import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui";
import EventForm from "@/components/admin/event-form";

export default async function NewEventPage() {
  const categories = await prisma.eventCategory.findMany();
  return (
    <div>
      <SectionHeading title="Create event" description="Saved as a draft until you publish it." />
      <EventForm categories={categories} />
    </div>
  );
}

import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Container, SectionHeading } from "@/components/ui";
import WaitlistForm from "./waitlist-form";

export default async function WaitlistPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await prisma.event.findUnique({ where: { slug }, include: { ticketCategories: { where: { visible: true } } } });
  if (!event || !event.waitlistEnabled) notFound();

  return (
    <Container className="py-14">
      <SectionHeading eyebrow={event.name} title="Join the waiting list" description="This event is currently sold out. Add your details below and we'll notify you the moment tickets become available." />
      <WaitlistForm eventId={event.id} categories={event.ticketCategories.map((c) => ({ id: c.id, name: c.name }))} />
    </Container>
  );
}

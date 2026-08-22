import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Badge, LinkButton } from "@/components/ui";
import EventForm from "@/components/admin/event-form";
import EventLifecycleActions from "@/components/admin/event-lifecycle-actions";

export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [event, categories] = await Promise.all([
    prisma.event.findUnique({
      where: { id },
      include: { images: true, faqs: true, questions: true, ticketCategories: true },
    }),
    prisma.eventCategory.findMany(),
  ]);
  if (!event) notFound();

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{event.name}</h1>
          <Badge color="gray">{event.status}</Badge>
        </div>
        <div className="flex gap-2">
          <LinkButton href={`/admin/events/${event.id}/guests`} variant="secondary" size="sm">Guest list</LinkButton>
          <LinkButton href={`/admin/events/${event.id}/waitlist`} variant="secondary" size="sm">Waitlist</LinkButton>
          <Link href={`/events/${event.slug}`} target="_blank" className="text-sm text-brand font-semibold self-center">Preview public page →</Link>
        </div>
      </div>
      <div className="mb-6">
        <EventLifecycleActions eventId={event.id} status={event.status} />
      </div>
      <EventForm
        eventId={event.id}
        categories={categories}
        initial={{
          ...event,
          startAt: event.startAt.toISOString(),
          endAt: event.endAt.toISOString(),
          bookingStartAt: event.bookingStartAt.toISOString(),
          bookingEndAt: event.bookingEndAt.toISOString(),
          images: event.images.map((i) => i.url),
          faqs: event.faqs.map((f) => ({ question: f.question, answer: f.answer })),
          questions: event.questions.map((q) => ({ label: q.label, type: q.type, options: q.options ?? "", required: q.required })),
          ticketCategories: event.ticketCategories.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description ?? "",
            price: c.price,
            totalQuantity: c.totalQuantity,
            minPerOrder: c.minPerOrder,
            maxPerOrder: c.maxPerOrder,
            refundEligible: c.refundEligible,
            benefits: c.benefits ?? "",
          })),
          venueName: event.venueName ?? "",
          addressLine1: event.addressLine1 ?? "",
          city: event.city ?? "",
          region: event.region ?? "",
          country: event.country ?? "",
          postalCode: event.postalCode ?? "",
          mapUrl: event.mapUrl ?? "",
          onlineUrl: event.onlineUrl ?? "",
          onlineInstructions: event.onlineInstructions ?? "",
          ageRestriction: event.ageRestriction ?? "",
          entryRequirements: event.entryRequirements ?? "",
          dressCode: event.dressCode ?? "",
          accessibilityInfo: event.accessibilityInfo ?? "",
          organizerPhone: event.organizerPhone ?? "",
          organizerBio: event.organizerBio ?? "",
          confirmationMessage: event.confirmationMessage ?? "",
          accessCode: event.accessCode ?? "",
        }}
      />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import { getEventDetail } from "@/lib/public-events";
import { getCategoryAvailability } from "@/lib/inventory";
import { isBookable } from "@/lib/event-status";
import BookingWizard from "@/components/booking/booking-wizard";
import { Container, Alert } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function BookEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ code?: string }>;
}) {
  const { slug } = await params;
  const { code } = await searchParams;
  const detail = await getEventDetail(slug, code);

  if (!detail) notFound();
  if (detail.requiresAccessCode) redirect(`/events/${slug}`);

  const { event, displayStatus } = detail;
  if (!isBookable(displayStatus)) {
    return (
      <Container className="py-16 max-w-lg">
        <Alert variant="warning">This event is not currently open for booking ({displayStatus.replace("_", " ").toLowerCase()}).</Alert>
      </Container>
    );
  }

  const categories = await Promise.all(
    event.ticketCategories
      .filter((c) => c.visible)
      .map(async (c) => {
        const avail = await getCategoryAvailability(c.id);
        return {
          id: c.id,
          name: c.name,
          description: c.description,
          price: c.price,
          currency: c.currency,
          minPerOrder: c.minPerOrder,
          maxPerOrder: c.maxPerOrder,
          status: c.status,
          remaining: avail.remaining,
          benefits: c.benefits,
        };
      })
  );

  return (
    <BookingWizard
      event={{
        id: event.id,
        slug: event.slug,
        name: event.name,
        startAt: event.startAt.toISOString(),
        timezone: event.timezone,
        refundPolicy: event.refundPolicy,
        termsAndConditions: event.termsAndConditions,
        currency: categories[0]?.currency ?? "PKR",
      }}
      categories={categories}
      questions={event.questions.map((q) => ({
        id: q.id,
        label: q.label,
        type: q.type,
        options: q.options ? (JSON.parse(q.options) as string[]) : [],
        required: q.required,
      }))}
    />
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Badge, Card, LinkButton, EmptyState } from "@/components/ui";
import { getEventDetail, getRelatedEvents } from "@/lib/public-events";
import { getCategoryAvailability, categoryStatusLabel } from "@/lib/inventory";
import { formatMoney } from "@/lib/money";
import { formatEventDateTime, timezoneAbbr } from "@/lib/format";
import { computeRefundDeadline, formatDeadline } from "@/lib/refund-policy";
import { displayStatusLabels, displayStatusColor, isBookable } from "@/lib/event-status";
import EventCard from "@/components/site/event-card";
import GalleryLightbox from "@/components/site/gallery-lightbox";
import AccessCodeForm from "./access-code-form";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
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
  if (detail.requiresAccessCode) {
    return <AccessCodeForm slug={slug} />;
  }

  const { event, displayStatus } = detail;
  const bookable = isBookable(displayStatus);
  const related = await getRelatedEvents(event.id, event.categoryId);

  const categoryAvailability = await Promise.all(
    event.ticketCategories.filter((c) => c.visible).map((c) => getCategoryAvailability(c.id))
  );

  const refundDeadline = computeRefundDeadline(event.startAt, event.refundDeadlineHours);
  const lowestPrice = event.ticketCategories.length ? Math.min(...event.ticketCategories.map((c) => c.price)) : 0;
  const allFree = event.ticketCategories.length > 0 && event.ticketCategories.every((c) => c.price === 0);

  return (
    <div>
      <div className="relative h-72 sm:h-96 bg-gray-900">
        <Image src={event.coverImage} alt={event.name} fill className="object-cover opacity-70" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <Container className="relative h-full flex flex-col justify-end pb-8 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Badge color={displayStatusColor[displayStatus]}>{displayStatusLabels[displayStatus]}</Badge>
            <span className="bg-white/20 backdrop-blur px-2.5 py-1 rounded-full text-xs font-semibold">{event.category.name}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold max-w-3xl">{event.name}</h1>
          <p className="mt-2 text-gray-200 max-w-2xl">{event.shortDescription}</p>

          <div className="flex flex-wrap gap-3 mt-5">
            <div className="flex items-center gap-2 bg-white text-gray-900 rounded-lg px-4 py-2.5 shadow-lg">
              <span className="text-lg">📅</span>
              <span className="font-bold text-sm sm:text-base">{formatEventDateTime(event.startAt, event.timezone)}</span>
            </div>
            {event.performerName && (
              <div className="flex items-center gap-2 bg-brand text-white rounded-lg px-4 py-2.5 shadow-lg">
                <span className="text-lg">🎤</span>
                <span className="font-bold text-sm sm:text-base">{event.performerName}</span>
              </div>
            )}
          </div>
        </Container>
      </div>

      <Container className="py-10 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          {event.status === "CANCELLED" && (
            <Card className="p-5 border-red-200 bg-red-50">
              <p className="font-bold text-red-800">This event has been cancelled</p>
              <p className="text-sm text-red-700 mt-1">{event.cancelledReason || "This event was cancelled by the organizer."}</p>
            </Card>
          )}
          {event.status === "RESCHEDULED" && (
            <Card className="p-5 border-amber-200 bg-amber-50">
              <p className="font-bold text-amber-800">This event has been rescheduled</p>
              {event.rescheduleNote && <p className="text-sm text-amber-700 mt-1">{event.rescheduleNote}</p>}
            </Card>
          )}
          {event.status === "POSTPONED" && (
            <Card className="p-5 border-amber-200 bg-amber-50">
              <p className="font-bold text-amber-800">This event has been postponed</p>
              <p className="text-sm text-amber-700 mt-1">A new date will be announced soon. Existing bookings remain valid.</p>
            </Card>
          )}

          <GalleryLightbox images={event.images} eventName={event.name} />

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">About this event</h2>
            <div className="prose-body text-gray-700 whitespace-pre-line">{event.fullDescription}</div>
          </section>

          <section className="grid sm:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Date & time</h3>
              <p className="text-sm text-gray-700">{formatEventDateTime(event.startAt, event.timezone)}</p>
              <p className="text-sm text-gray-500">to {formatEventDateTime(event.endAt, event.timezone)} ({timezoneAbbr(event.startAt, event.timezone)})</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">{event.format === "ONLINE" ? "Online event" : "Location"}</h3>
              {event.format !== "ONLINE" ? (
                <>
                  <p className="text-sm text-gray-700">{event.venueName}</p>
                  <p className="text-sm text-gray-500">{[event.addressLine1, event.city, event.region, event.country].filter(Boolean).join(", ")}</p>
                  {event.mapUrl && (
                    <a href={event.mapUrl} target="_blank" className="text-sm text-brand font-semibold">Get directions →</a>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-700">{event.onlineInstructions || "Join link provided after booking."}</p>
              )}
              {event.format === "HYBRID" && event.onlineUrl && (
                <p className="text-sm text-gray-500 mt-1">Also available online — link sent after booking.</p>
              )}
            </div>
            {event.ageRestriction && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Age restriction</h3>
                <p className="text-sm text-gray-700">{event.ageRestriction}</p>
              </div>
            )}
            {event.entryRequirements && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Entry requirements</h3>
                <p className="text-sm text-gray-700">{event.entryRequirements}</p>
              </div>
            )}
            {event.dressCode && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Dress code</h3>
                <p className="text-sm text-gray-700">{event.dressCode}</p>
              </div>
            )}
            {event.accessibilityInfo && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Accessibility</h3>
                <p className="text-sm text-gray-700">{event.accessibilityInfo}</p>
              </div>
            )}
          </section>

          {event.performerName && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-2">Featuring</h3>
              <p className="text-base text-gray-900 font-bold">{event.performerName}</p>
            </section>
          )}

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
            <p className="text-sm text-gray-700 font-medium">{event.organizerName}</p>
            {event.organizerBio && <p className="text-sm text-gray-500">{event.organizerBio}</p>}
            <p className="text-sm text-brand mt-1">{event.organizerEmail}</p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Refund policy</h3>
            <p className="text-sm text-gray-700">{event.refundPolicy}</p>
            <p className="text-sm text-gray-500 mt-1">
              Refund deadline: {formatDeadline(refundDeadline, event.timezone)} — refund requests close 48 hours before the event begins.
            </p>
          </section>

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Terms & conditions</h3>
            <p className="text-sm text-gray-700 whitespace-pre-line">{event.termsAndConditions}</p>
          </section>

          {event.faqs.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-900 mb-3">Frequently asked questions</h3>
              <div className="space-y-4">
                {event.faqs.map((f) => (
                  <div key={f.id}>
                    <p className="font-medium text-gray-900 text-sm">{f.question}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="font-semibold text-gray-900 mb-2">Need help?</h3>
            <p className="text-sm text-gray-600">
              Questions about this event? <Link href="/contact" className="text-brand font-semibold">Contact support</Link>.
            </p>
          </section>
        </div>

        {/* Booking sidebar */}
        <div>
          <Card className="p-6 sticky top-24">
            <p className="text-sm text-gray-500 mb-1">{allFree ? "Free event" : "Starting from"}</p>
            <p className="text-3xl font-bold text-gray-900 mb-4">{allFree ? "Free" : formatMoney(lowestPrice)}</p>

            <div className="space-y-3 mb-5">
              {event.ticketCategories.filter((c) => c.visible).map((cat) => {
                const avail = categoryAvailability.find((a) => a.category.id === cat.id)!;
                return (
                  <div key={cat.id} className="flex items-center justify-between text-sm border-b border-gray-100 pb-2">
                    <div>
                      <p className="font-medium text-gray-900">{cat.name}</p>
                      <p className="text-xs text-gray-500">{categoryStatusLabel(cat.status, avail.remaining)}</p>
                    </div>
                    <p className="font-semibold text-gray-900">{cat.price === 0 ? "Free" : formatMoney(cat.price)}</p>
                  </div>
                );
              })}
            </div>

            {bookable ? (
              <LinkButton href={`/book/${event.slug}${code ? `?code=${code}` : ""}`} className="w-full" size="lg">
                Book Tickets
              </LinkButton>
            ) : displayStatus === "SOLD_OUT" && event.waitlistEnabled ? (
              <LinkButton href={`/events/${event.slug}/waitlist${code ? `?code=${code}` : ""}`} className="w-full" size="lg" variant="dark">
                Join Waitlist
              </LinkButton>
            ) : (
              <button disabled className="w-full rounded-lg bg-gray-200 text-gray-500 font-semibold py-3 cursor-not-allowed">
                {displayStatusLabels[displayStatus]}
              </button>
            )}
            <p className="text-xs text-gray-400 mt-3 text-center">Capacity: {event.capacity} · {detail.capacityRemaining} spots remaining</p>
          </Card>
        </div>
      </Container>

      {related.length > 0 && (
        <Container className="pb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Related events</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {related.map((r) => {
              const cats = r.ticketCategories.filter((c) => c.visible);
              const low = cats.length ? Math.min(...cats.map((c) => c.price)) : 0;
              const free = cats.length > 0 && cats.every((c) => c.price === 0);
              return (
                <EventCard
                  key={r.id}
                  data={{
                    id: r.id,
                    slug: r.slug,
                    name: r.name,
                    shortDescription: r.shortDescription,
                    coverImage: r.coverImage,
                    startAt: r.startAt,
                    endAt: r.endAt,
                    timezone: r.timezone,
                    format: r.format,
                    venueName: r.venueName,
                    city: r.city,
                    lowestPrice: low,
                    isFree: free,
                    displayStatus: "BOOKING_OPEN",
                    categoryName: r.category.name,
                  }}
                />
              );
            })}
          </div>
        </Container>
      )}
    </div>
  );
}

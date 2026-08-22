import Link from "next/link";
import { Container, LinkButton, SectionHeading, Card } from "@/components/ui";
import EventCard from "@/components/site/event-card";
import { listPublishedEvents } from "@/lib/public-events";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/site/search-bar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [all, categories, faqs] = await Promise.all([
    listPublishedEvents({ sort: "date" }),
    prisma.eventCategory.findMany({ include: { _count: { select: { events: true } } } }),
    prisma.siteFAQ.findMany({ orderBy: { position: "asc" }, take: 5 }),
  ]);

  const featured = all.filter((m) => m.event.featured).slice(0, 3);
  const upcoming = all.slice(0, 8);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-gray-900 to-gray-900" />
        <Container className="relative py-20 sm:py-28">
          <p className="text-brand font-semibold mb-3 tracking-wide uppercase text-sm">Discover · Book · Attend</p>
          <h1 className="text-4xl sm:text-5xl font-extrabold max-w-2xl leading-tight">
            Find your next unforgettable event
          </h1>
          <p className="mt-4 text-lg text-gray-300 max-w-xl">
            Conferences, festivals, comedy nights, and more — book tickets in minutes, no account required.
          </p>
          <div className="mt-8 max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-gray-300">
            {categories.map((c) => (
              <Link key={c.id} href={`/events?category=${c.slug}`} className="rounded-full border border-gray-700 px-3 py-1 hover:border-brand hover:text-white">
                {c.name} ({c._count.events})
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* Featured */}
      {featured.length > 0 && (
        <Container className="py-16">
          <SectionHeading eyebrow="Don't miss out" title="Featured events" description="Hand-picked events our community is most excited about." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((m) => (
              <EventCard
                key={m.event.id}
                data={{
                  id: m.event.id,
                  slug: m.event.slug,
                  name: m.event.name,
                  shortDescription: m.event.shortDescription,
                  coverImage: m.event.coverImage,
                  startAt: m.event.startAt,
                  endAt: m.event.endAt,
                  timezone: m.event.timezone,
                  format: m.event.format,
                  venueName: m.event.venueName,
                  city: m.event.city,
                  lowestPrice: m.lowestPrice,
                  isFree: m.isFree,
                  displayStatus: m.displayStatus,
                  categoryName: m.event.category.name,
                }}
              />
            ))}
          </div>
        </Container>
      )}

      {/* Upcoming */}
      <Container className="py-8">
        <SectionHeading eyebrow="Happening soon" title="Upcoming events" description="Browse what's coming up across every category." />
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {upcoming.map((m) => (
            <EventCard
              key={m.event.id}
              data={{
                id: m.event.id,
                slug: m.event.slug,
                name: m.event.name,
                shortDescription: m.event.shortDescription,
                coverImage: m.event.coverImage,
                startAt: m.event.startAt,
                endAt: m.event.endAt,
                timezone: m.event.timezone,
                format: m.event.format,
                venueName: m.event.venueName,
                city: m.event.city,
                lowestPrice: m.lowestPrice,
                isFree: m.isFree,
                displayStatus: m.displayStatus,
                categoryName: m.event.category.name,
              }}
            />
          ))}
        </div>
        <div className="mt-8 text-center">
          <LinkButton href="/events" variant="secondary">
            View all events
          </LinkButton>
        </div>
      </Container>

      {/* Why us */}
      <div className="bg-white border-y border-gray-200 mt-16">
        <Container className="py-16">
          <SectionHeading eyebrow="Why Gatherly" title="Booking made effortless" />
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { title: "No account required", body: "Book as a guest in minutes — we'll set up your account automatically after checkout." },
              { title: "Secure, instant tickets", body: "Every attendee gets a unique, scannable ticket delivered by email the moment payment clears." },
              { title: "Fair refund policy", body: "Clear, consistent refund rules across every event — refundable up to 48 hours before the show." },
            ].map((f) => (
              <Card key={f.title} className="p-6">
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.body}</p>
              </Card>
            ))}
          </div>
        </Container>
      </div>

      {/* How it works */}
      <Container className="py-16">
        <SectionHeading eyebrow="Simple process" title="How booking works" />
        <div className="grid sm:grid-cols-4 gap-6">
          {[
            { step: "1", title: "Find an event", body: "Search or browse by category, city, or date." },
            { step: "2", title: "Choose tickets", body: "Pick ticket types and enter attendee details." },
            { step: "3", title: "Pay securely", body: "Complete checkout — free events skip this step." },
            { step: "4", title: "Get your tickets", body: "Tickets arrive by email and in your dashboard instantly." },
          ].map((s) => (
            <div key={s.step}>
              <div className="h-10 w-10 rounded-full bg-brand text-white font-bold flex items-center justify-center mb-3">{s.step}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </Container>

      {/* Support */}
      <div className="bg-gray-900 text-white">
        <Container className="py-16 grid sm:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">Need help with a booking?</h2>
            <p className="text-gray-300">Our support team responds within one business day for questions about bookings, refunds, or event details.</p>
          </div>
          <div className="flex sm:justify-end gap-3">
            <LinkButton href="/contact" variant="primary">Contact Support</LinkButton>
            <LinkButton href="/faq" variant="secondary" className="!bg-transparent !text-white !border-gray-600">
              Read FAQ
            </LinkButton>
          </div>
        </Container>
      </div>

      {/* FAQ */}
      <Container className="py-16">
        <SectionHeading eyebrow="Questions" title="Frequently asked questions" />
        <div className="grid sm:grid-cols-2 gap-6">
          {faqs.map((f) => (
            <div key={f.id}>
              <h3 className="font-semibold text-gray-900 mb-1">{f.question}</h3>
              <p className="text-sm text-gray-600">{f.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <LinkButton href="/faq" variant="ghost">See all FAQs →</LinkButton>
        </div>
      </Container>
    </div>
  );
}

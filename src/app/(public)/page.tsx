import Link from "next/link";
import Image from "next/image";
import { Container, LinkButton, Card } from "@/components/ui";
import EventCard from "@/components/site/event-card";
import { listPublishedEvents } from "@/lib/public-events";
import { prisma } from "@/lib/prisma";
import SearchBar from "@/components/site/search-bar";
import Reveal from "@/components/site/reveal";
import { formatShortDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const SCENES = [
  {
    label: "Concerts",
    query: "concert",
    icon: (
      <path d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zM21 16a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
  {
    label: "Comedy",
    query: "comedy",
    icon: <><circle cx="12" cy="12" r="9" /><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" /></>,
  },
  {
    label: "Festivals",
    query: "festival",
    icon: <path d="M5 3v18M5 4l13 3-13 4" />,
  },
  {
    label: "Theatre",
    query: "theatre",
    icon: (
      <>
        <path d="M8 9a3 3 0 106 0 3 3 0 00-6 0zM8 9c0 3-3 4-3 7a3 3 0 006 0M14 9c0 3 3 4 3 7a3 3 0 01-6 0" />
      </>
    ),
  },
  {
    label: "Sports",
    query: "sports",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v6l5 3-2 6h-6l-2-6 5-3z" />
      </>
    ),
  },
  {
    label: "Experiences",
    query: "experience",
    icon: <path d="M12 2l2.9 6.1 6.7.9-4.9 4.6 1.2 6.6L12 17l-6 3.2 1.2-6.6-4.9-4.6 6.7-.9z" />,
  },
];

export default async function HomePage() {
  const [all, faqs] = await Promise.all([
    listPublishedEvents({ sort: "date" }),
    prisma.siteFAQ.findMany({ orderBy: { position: "asc" }, take: 4 }),
  ]);

  const featured = all.filter((m) => m.event.featured).slice(0, 3);
  const upcoming = all.slice(0, 8);
  const spotlight = featured[0] ?? upcoming[0];

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1920"
            alt=""
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
        </div>

        <Container className="relative py-24 sm:py-32">
          <p className="text-white/70 font-semibold mb-4 tracking-wide uppercase text-xs">Find It · Book It · Be There</p>
          <h1 className="text-4xl sm:text-6xl font-extrabold max-w-2xl leading-[1.05] text-white">
            Your ticket to <span className="gradient-text">what&apos;s happening.</span>
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-xl">
            Concerts, comedy, festivals, sports, experiences &amp; more.
          </p>

          <div className="mt-8 max-w-xl">
            <SearchBar />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-4 text-white">
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 7l16-2v14l-16-2V7z" /><path d="M4 7a2 2 0 002-2M20 5a2 2 0 01-2 2M4 17a2 2 0 012 2M20 19a2 2 0 00-2-2" /></svg>
              <div>
                <p className="text-sm font-semibold leading-tight">Find Events</p>
                <p className="text-xs text-white/60 leading-tight">Discover what&apos;s on</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>
              <div>
                <p className="text-sm font-semibold leading-tight">Book Securely</p>
                <p className="text-xs text-white/60 leading-tight">via JazzCash</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3 2.5-5 6-5s6 2 6 5M15 15c2.8 0 5 1.8 5 4.5" /></svg>
              <div>
                <p className="text-sm font-semibold leading-tight">Be There</p>
                <p className="text-xs text-white/60 leading-tight">Create memories</p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Featured event spotlight */}
      {spotlight && (
        <section className="bg-ink py-14 sm:py-20">
          <Container>
            <Reveal>
              <div className="flex items-center gap-2 mb-6">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-pink opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-pink" />
                </span>
                <p className="text-white/70 font-semibold uppercase tracking-wide text-xs">Featured event</p>
              </div>
            </Reveal>
            <Reveal>
              <Link
                href={`/events/${spotlight.event.slug}`}
                className="group block overflow-hidden rounded-2xl shadow-2xl ring-1 ring-white/10 bg-ink"
              >
                <div className="relative aspect-[1280/476] w-full bg-black">
                  <Image
                    src="/adnan-dhool-banner.jpg"
                    alt={spotlight.event.name}
                    fill
                    sizes="100vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="p-5 sm:p-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10">
                  <div>
                    <h3 className="text-white font-extrabold text-xl sm:text-2xl mb-1">{spotlight.event.name}</h3>
                    <p className="text-white/70 text-sm">
                      {formatShortDate(spotlight.event.startAt, spotlight.event.timezone)}
                      {spotlight.event.venueName ? ` · ${spotlight.event.venueName}` : ""}
                      {spotlight.event.city ? `, ${spotlight.event.city}` : ""}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-white text-ink font-bold px-5 py-2.5 rounded-full shadow-lg group-hover:gap-3 transition-all whitespace-nowrap">
                    Book Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                  </span>
                </div>
              </Link>
            </Reveal>
          </Container>
        </section>
      )}

      {/* Find your scene */}
      <Container className="py-16">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-1">Find your scene.</h2>
          <p className="text-gray-500 mb-8">Browse events by category.</p>
        </Reveal>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {SCENES.map((s, i) => (
            <Reveal key={s.label} delay={i * 60}>
              <Link
                href={`/events?q=${encodeURIComponent(s.query)}`}
                className="group flex flex-col items-center gap-3 p-4 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <span className="h-14 w-14 rounded-full border-2 border-ink/10 flex items-center justify-center text-ink group-hover:border-brand group-hover:text-brand group-hover:scale-105 transition-all">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    {s.icon}
                  </svg>
                </span>
                <span className="text-sm font-semibold text-ink text-center">{s.label}</span>
              </Link>
            </Reveal>
          ))}
        </div>
        <p className="text-center text-xs text-gray-400 uppercase tracking-wide mt-6">And more — events coming soon</p>
      </Container>

      {/* Featured / Upcoming */}
      {featured.length > 0 && (
        <Container className="py-8">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-ink mb-1">What&apos;s happening?</h2>
            <p className="text-gray-500 mb-8">Discover events worth showing up for.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map((m, i) => (
              <Reveal key={m.event.id} delay={i * 80}>
                <EventCard
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
              </Reveal>
            ))}
          </div>
        </Container>
      )}

      {/* Ticket pricing spotlight */}
      {spotlight && (
        <Container className="py-16">
          <Reveal>
            <Link
              href={`/events/${spotlight.event.slug}`}
              className="group grid sm:grid-cols-2 rounded-2xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-2xl transition-shadow bg-white"
            >
              <div className="relative aspect-square sm:aspect-auto overflow-hidden">
                <Image
                  src="/adnan-dhool-poster.jpg"
                  alt={`${spotlight.event.name} ticket pricing`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="p-8 sm:p-10 flex flex-col justify-center bg-ink text-white">
                <p className="text-brand-pink font-semibold uppercase tracking-wide text-xs mb-3">Early bird pricing</p>
                <h3 className="text-2xl sm:text-3xl font-extrabold mb-3 leading-tight">
                  Lock in your seat before prices go up.
                </h3>
                <p className="text-white/70 mb-6">
                  VIP rows, reserved seating, family &amp; stag sections — see every tier and grab the early bird
                  discount while it lasts.
                </p>
                <span className="inline-flex items-center gap-2 self-start bg-brand-gradient bg-[length:200%_auto] group-hover:bg-right transition-[background-position,gap] duration-500 text-white font-bold px-6 py-3 rounded-full">
                  View Ticket Pricing
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                </span>
              </div>
            </Link>
          </Reveal>
        </Container>
      )}

      {/* Launch offer */}
      <section className="mt-8 bg-gradient-to-r from-ink via-brand-purple/80 to-brand-pink/70 relative overflow-hidden">
        <Container className="py-16 relative">
          <Reveal>
            <p className="text-white/70 font-semibold uppercase tracking-wide text-xs mb-2">Launch offer</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">Be early. Save more.</h2>
            <p className="text-white/80 mb-8">Our earliest Ticket Buddies get rewarded.</p>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-5 max-w-2xl">
            <Reveal>
              <Card className="p-6 border-2 !border-brand-purple">
                <p className="text-xs font-bold text-ink/60 uppercase tracking-wide mb-2">First 1,000</p>
                <p className="text-3xl font-extrabold text-brand-purple mb-1">5% OFF FOR LIFE</p>
                <p className="text-sm text-gray-500">Eligible Ticket Buddy bookings</p>
              </Card>
            </Reveal>
            <Reveal delay={100}>
              <Card className="p-6 border-2 !border-brand-pink">
                <p className="text-xs font-bold text-ink/60 uppercase tracking-wide mb-2">First 10,000</p>
                <p className="text-3xl font-extrabold text-brand-pink mb-1">5% OFF FOR 1 YEAR</p>
                <p className="text-sm text-gray-500">Eligible Ticket Buddy bookings</p>
              </Card>
            </Reveal>
          </div>
          <p className="text-xs text-white/60 mt-6">On eligible Ticket Buddy bookings. Terms and conditions apply.</p>
          <div className="mt-6">
            <LinkButton href="/#stay-updated" variant="secondary">Follow Ticket Buddy</LinkButton>
          </div>
        </Container>
      </section>

      {/* Three steps */}
      <Container className="py-20">
        <Reveal>
          <h2 className="text-2xl sm:text-3xl font-bold text-ink text-center mb-1">Three steps. That&apos;s it.</h2>
          <p className="text-gray-500 text-center mb-10">Find it. Book it. Be there.</p>
        </Reveal>
        <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { title: "Find It.", body: "Discover what's happening." },
            { title: "Book It.", body: "Get your ticket online — pay securely via JazzCash." },
            { title: "Be There.", body: "Show your ticket and enjoy." },
          ].map((s, i) => (
            <Reveal key={s.title} delay={i * 100} className="text-center">
              <div className="h-14 w-14 rounded-full bg-brand-gradient text-white font-bold flex items-center justify-center mx-auto mb-4 text-lg">
                {i + 1}
              </div>
              <h3 className="font-bold text-ink text-lg mb-1">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.body}</p>
            </Reveal>
          ))}
        </div>
      </Container>

      {/* Organizer CTA */}
      <div className="bg-ink">
        <Container className="py-16 grid sm:grid-cols-2 gap-8 items-center">
          <Reveal>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Got an event?</h2>
            <p className="text-white/70">Sell tickets and reach your audience with Ticket Buddy.</p>
          </Reveal>
          <Reveal delay={100} className="sm:text-right">
            <LinkButton href="/for-organizers" className="!bg-brand-gradient !bg-[length:200%_auto] hover:!bg-right transition-[background-position] duration-500">
              List Your Event
            </LinkButton>
          </Reveal>
        </Container>
      </div>

      {/* FAQ */}
      {faqs.length > 0 && (
        <Container className="py-16">
          <Reveal>
            <h2 className="text-2xl font-bold text-ink mb-8">Frequently asked questions</h2>
          </Reveal>
          <div className="grid sm:grid-cols-2 gap-6">
            {faqs.map((f, i) => (
              <Reveal key={f.id} delay={i * 60}>
                <h3 className="font-semibold text-ink mb-1">{f.question}</h3>
                <p className="text-sm text-gray-600">{f.answer}</p>
              </Reveal>
            ))}
          </div>
          <div className="mt-6">
            <LinkButton href="/faq" variant="ghost">See all FAQs →</LinkButton>
          </div>
        </Container>
      )}

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-ink">
        {spotlight && (
          <Image src={spotlight.event.coverImage} alt="" fill className="object-cover opacity-25" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/70" />
        <Container className="relative py-20 text-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Don&apos;t just hear about it. <span className="gradient-text">Be there.</span>
            </h2>
            <LinkButton href="/events" size="lg" className="!bg-brand-gradient !bg-[length:200%_auto] hover:!bg-right transition-[background-position] duration-500">
              Explore Events
            </LinkButton>
          </Reveal>
        </Container>
      </section>
    </div>
  );
}

import Link from "next/link";
import { Container, SectionHeading, EmptyState, Select, Input, LinkButton } from "@/components/ui";
import EventCard from "@/components/site/event-card";
import { listPublishedEvents, type EventFilters } from "@/lib/public-events";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function FilterForm({ searchParams, categories }: { searchParams: Record<string, string | undefined>; categories: { name: string; slug: string }[] }) {
  return (
    <form className="grid sm:grid-cols-2 lg:grid-cols-6 gap-3 bg-white p-4 rounded-xl border border-gray-200 mb-8">
      <div className="lg:col-span-2">
        <Input name="q" placeholder="Search events, venues, cities..." defaultValue={searchParams.q} />
      </div>
      <Select name="category" defaultValue={searchParams.category ?? ""}>
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c.slug} value={c.slug}>{c.name}</option>
        ))}
      </Select>
      <Select name="format" defaultValue={searchParams.format ?? ""}>
        <option value="">Physical, online or hybrid</option>
        <option value="PHYSICAL">In-person</option>
        <option value="ONLINE">Online</option>
        <option value="HYBRID">Hybrid</option>
      </Select>
      <Select name="priceType" defaultValue={searchParams.priceType ?? ""}>
        <option value="">Free or paid</option>
        <option value="FREE">Free</option>
        <option value="PAID">Paid</option>
      </Select>
      <Select name="sort" defaultValue={searchParams.sort ?? "date"}>
        <option value="date">Sort: Event date</option>
        <option value="recent">Sort: Recently added</option>
        <option value="price_asc">Sort: Price (low to high)</option>
        <option value="price_desc">Sort: Price (high to low)</option>
        <option value="popularity">Sort: Popularity</option>
        <option value="availability">Sort: Availability</option>
      </Select>
      <div>
        <Input type="text" name="city" placeholder="City" defaultValue={searchParams.city} />
      </div>
      <div>
        <Input type="date" name="dateFrom" defaultValue={searchParams.dateFrom} />
      </div>
      <div>
        <Input type="date" name="dateTo" defaultValue={searchParams.dateTo} />
      </div>
      <div className="lg:col-span-2 flex gap-2">
        <button type="submit" className="rounded-lg bg-brand text-white px-4 py-2 text-sm font-semibold hover:bg-brand-dark">
          Apply filters
        </button>
        <Link href="/events" className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Clear
        </Link>
      </div>
    </form>
  );
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const filters: EventFilters = {
    q: sp.q,
    category: sp.category,
    city: sp.city,
    format: sp.format as EventFilters["format"],
    priceType: sp.priceType as EventFilters["priceType"],
    dateFrom: sp.dateFrom,
    dateTo: sp.dateTo,
    sort: (sp.sort as EventFilters["sort"]) ?? "date",
  };

  const [results, categories] = await Promise.all([listPublishedEvents(filters), prisma.eventCategory.findMany()]);

  return (
    <Container className="py-12">
      <SectionHeading eyebrow="Browse" title="All events" description={`${results.length} event${results.length === 1 ? "" : "s"} found`} />
      <FilterForm searchParams={sp} categories={categories} />
      {results.length === 0 ? (
        <EmptyState
          title="No events match your filters"
          description="Try widening your search or clearing a filter."
          action={<LinkButton href="/events" variant="secondary">Clear filters</LinkButton>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((m) => (
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
      )}
    </Container>
  );
}

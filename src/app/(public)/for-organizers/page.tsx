import { Container, SectionHeading, Card } from "@/components/ui";
import OrganizerForm from "./organizer-form";

export const metadata = {
  title: "For Organizers — Ticket Buddy",
  description: "Sell tickets and reach your audience with Ticket Buddy — list your concert, conference, or event.",
};

const BENEFITS = [
  { title: "Sell tickets online", body: "List your event with full details — ticket categories, pricing in PKR, early-bird tiers, and capacity limits." },
  { title: "Get paid via JazzCash", body: "Customers pay securely through JazzCash; payments are tracked and reconciled automatically." },
  { title: "Manage check-in on the day", body: "A mobile-friendly check-in portal for your staff — scan or search, no spreadsheets." },
  { title: "Reach a ready audience", body: "Your event appears alongside others on Ticket Buddy's homepage and events listing." },
];

export default function ForOrganizersPage() {
  return (
    <div>
      <div className="bg-ink text-white">
        <Container className="py-16">
          <p className="text-white/70 font-semibold uppercase tracking-wide text-xs mb-3">For Organizers</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold max-w-xl mb-3">Got an event?</h1>
          <p className="text-white/80 max-w-xl">Sell tickets and reach your audience with Ticket Buddy.</p>
        </Container>
      </div>

      <Container className="py-14">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-10">
            <div>
              <SectionHeading eyebrow="Why organizers choose us" title="Everything you need to sell tickets online" />
              <div className="grid sm:grid-cols-2 gap-5">
                {BENEFITS.map((b) => (
                  <Card key={b.title} className="p-5">
                    <p className="font-semibold text-ink mb-1">{b.title}</p>
                    <p className="text-sm text-gray-600">{b.body}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Card className="p-6">
              <h2 className="font-semibold text-ink mb-1">List your event</h2>
              <p className="text-sm text-gray-500 mb-4">Tell us about your event and we&apos;ll get back to you within one business day.</p>
              <OrganizerForm />
            </Card>
          </div>
        </div>
      </Container>
    </div>
  );
}

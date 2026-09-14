import Link from "next/link";
import { Container, SectionHeading, Card, LinkButton } from "@/components/ui";

export const metadata = {
  title: "How It Works — Ticket Buddy",
  description: "How Ticket Buddy works: browsing events, booking tickets, paying securely, and receiving your tickets.",
};

export default function HowItWorksPage() {
  return (
    <div>
      <Container className="py-14 max-w-4xl">
        <SectionHeading
          eyebrow="Our business model"
          title="How Ticket Buddy works"
          description="Ticket Buddy is an online ticketing platform based in Lahore, Pakistan. We provide event organizers — such as Actual Wala Live — with the tools to list events and sell tickets online, and we provide customers with a simple, secure way to discover events, buy tickets, and receive them instantly by email."
        />

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">The complete customer journey</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Browse & select", body: "Customers browse live events on our website — for example, Actual Wala Live's concerts — and view full details: date, time, venue, ticket categories, and pricing in PKR." },
              { step: "2", title: "Add attendee details", body: "The customer chooses one or more ticket categories (e.g. VIP, Family & Ladies, Stags/Single Male), enters buyer and attendee details, and applies a discount code if eligible." },
              { step: "3", title: "Pay & upload proof", body: "At checkout, the customer pays the total amount by bank transfer or QR code using the account details shown, then uploads a screenshot of the payment as proof. No card or bank credentials are ever entered on our site." },
              { step: "4", title: "Get tickets once verified", body: "Our team manually verifies each payment against the amount and account shown. Once approved, a unique digital ticket (with a scannable QR code) is generated per attendee and emailed immediately, and is also always available for download from the customer's account." },
            ].map((s) => (
              <Card key={s.step} className="p-5">
                <div className="h-9 w-9 rounded-full bg-brand text-white font-bold flex items-center justify-center mb-3">{s.step}</div>
                <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-3">How payment works</h2>
          <Card className="p-6">
            <p className="text-sm text-gray-700 mb-3">
              Ticket Buddy uses a manual, verified payment process for all ticket purchases. At checkout, the customer sees
              our payment account details and a QR code, and transfers the total amount directly using their own banking or
              mobile wallet app. They then upload a screenshot of the completed payment as proof.
            </p>
            <p className="text-sm text-gray-700 mb-3">
              The booking is held as &quot;Payment Verification Pending&quot; while our team checks the uploaded proof against
              the amount and account shown. Once approved, the booking is confirmed and the customer&apos;s tickets are
              emailed immediately — this is the only point at which a ticket becomes valid.
            </p>
            <p className="text-sm text-gray-700">
              All prices on Ticket Buddy are displayed and charged in Pakistani Rupees (PKR). We do not collect or store card
              numbers, bank credentials, or wallet PINs at any point — only the payment screenshot the customer chooses to
              upload as proof.
            </p>
          </Card>
        </section>

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-3">Ticket delivery</h2>
          <Card className="p-6">
            <p className="text-sm text-gray-700">
              Tickets are a <strong>digital product</strong> — there is no physical shipping involved. Every attendee receives an
              individual e-ticket with a unique, scannable code by email immediately after payment is confirmed, and can also
              download it any time from their account dashboard. See our{" "}
              <Link href="/shipping-policy" className="text-brand font-semibold">Shipping / Delivery Policy</Link> for details.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Refunds & cancellations</h2>
          <Card className="p-6">
            <p className="text-sm text-gray-700">
              Tickets can be refunded up until 48 hours before an event&apos;s scheduled start time, subject to the specific
              event&apos;s refund policy shown on its event page. Read our full{" "}
              <Link href="/refund-policy" className="text-brand font-semibold">Refund & Cancellation Policy</Link>.
            </p>
          </Card>
        </section>

        <div className="mt-12 flex justify-center">
          <LinkButton href="/events">Browse events</LinkButton>
        </div>
      </Container>
    </div>
  );
}

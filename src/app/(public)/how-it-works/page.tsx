import Link from "next/link";
import { Container, SectionHeading, Card, LinkButton } from "@/components/ui";

export const metadata = {
  title: "How It Works — TicketBuddy.pk",
  description: "How TicketBuddy.pk works: browsing events, booking tickets, paying securely, and receiving your tickets.",
};

export default function HowItWorksPage() {
  return (
    <div>
      <Container className="py-14 max-w-4xl">
        <SectionHeading
          eyebrow="Our business model"
          title="How TicketBuddy.pk works"
          description="TicketBuddy.pk is an online ticketing platform based in Lahore, Pakistan. We provide event organizers — such as Actual Wala Live — with the tools to list events and sell tickets online, and we provide customers with a simple, secure way to discover events, buy tickets, and receive them instantly by email."
        />

        <section className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">The complete customer journey</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { step: "1", title: "Browse & select", body: "Customers browse live events on our website — for example, Actual Wala Live's concerts — and view full details: date, time, venue, ticket categories, and pricing in PKR." },
              { step: "2", title: "Add attendee details", body: "The customer chooses one or more ticket categories (e.g. VIP, Family & Ladies, Stags/Single Male), enters buyer and attendee details, and applies a discount code if eligible." },
              { step: "3", title: "Pay securely", body: "At checkout, the customer pays the total amount using JazzCash — either their JazzCash mobile wallet or a linked debit/credit card via JazzCash's Hosted Checkout. No card or wallet details are ever stored on our servers." },
              { step: "4", title: "Receive tickets instantly", body: "Once JazzCash confirms payment, a unique digital ticket (with a scannable QR code) is generated per attendee and emailed immediately. Tickets are also always available for download from the customer's account." },
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
          <h2 className="text-xl font-bold text-gray-900 mb-3">How payment works (JazzCash)</h2>
          <Card className="p-6">
            <p className="text-sm text-gray-700 mb-3">
              JazzCash is our payment gateway for all ticket purchases. When a customer clicks &quot;Pay,&quot; they are redirected to
              JazzCash&apos;s secure hosted payment page, where they authenticate and approve the payment using their own JazzCash
              wallet PIN or card credentials. JazzCash then confirms the transaction back to TicketBuddy.pk, and the booking is
              marked as paid — this happens automatically, with no manual step required from our side.
            </p>
            <p className="text-sm text-gray-700">
              All prices on TicketBuddy.pk are displayed and charged in Pakistani Rupees (PKR). We do not store card numbers,
              wallet PINs, or CVV codes at any point — that information is entered directly on JazzCash&apos;s page, not ours.
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

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const BUSINESS_ADDRESS = "604 N Block, Samanabad, Lahore, Pakistan";
const SUPPORT_EMAIL = "tickets@ticketbuddy.pk";
const SUPPORT_PHONE = "0347 6581443 / 0304 1549196";

const pages: { slug: string; title: string; content: string }[] = [
  {
    slug: "about",
    title: "About Ticket Buddy",
    content: `Ticket Buddy is an online event ticketing platform based in Lahore, Pakistan. We help event organizers — such as Actual Wala Live, a live concert and cultural events producer — sell tickets online, and we give customers a fast, secure way to discover events, book tickets, and receive them instantly by email.

Our business model: organizers list their events (concerts, conferences, comedy nights, and more) on Ticket Buddy with full details — date, time, venue, ticket categories, and pricing in PKR. Customers browse events, select ticket categories, enter attendee details, and pay securely through JazzCash. Once payment is confirmed, a unique digital ticket with a scannable code is generated for every attendee and delivered by email, and is always available for download from the customer's account.

Ticket Buddy operates from 604 N Block, Samanabad, Lahore, Pakistan, and can be reached at tickets@ticketbuddy.pk or 0347 6581443 / 0304 1549196.

Read a full walkthrough of how booking, payment, and ticket delivery work on our How It Works page.`,
  },
  {
    slug: "contact",
    title: "Contact & Support",
    content: `Have a question about an upcoming event, a booking, or a refund? Our support team typically responds within one business day. For urgent day-of-event issues, please contact the event organizer directly using the details on your ticket.

Ticket Buddy
604 N Block, Samanabad, Lahore, Pakistan
Email: ${SUPPORT_EMAIL}
Phone: ${SUPPORT_PHONE}`,
  },
  {
    slug: "refund-policy",
    title: "Refund & Cancellation Policy",
    content: `Unless otherwise noted on a specific event page, tickets purchased through Ticket Buddy may be refunded up until 48 hours before the event's scheduled start time. Refund requests submitted less than 48 hours before an event, after the event has started, or after the event has ended will not be accepted. Checked-in tickets are not eligible for refunds.

How to request a refund: sign in to your Ticket Buddy account, open the relevant booking, and submit a refund request with a reason. Our support team (or the event organizer's finance staff) will review the request and notify you by email of the decision.

Refund timeline: approved refunds are returned to the original JazzCash wallet or card used for payment. JazzCash typically settles refunds within 3–7 business days of approval, depending on the payment method used.

If an event is cancelled or significantly rescheduled by its organizer, affected customers will be contacted directly with refund or credit options, which may fall outside the standard 48-hour window at the organizer's discretion.

Questions about a specific refund? Contact us at ${SUPPORT_EMAIL} or ${SUPPORT_PHONE}.`,
  },
  {
    slug: "shipping-policy",
    title: "Shipping / Delivery Policy",
    content: `Ticket Buddy sells digital event tickets only — there are no physical goods and no physical shipping involved in any purchase made on this website.

How tickets are delivered: once a payment is successfully confirmed by JazzCash, Ticket Buddy automatically generates one unique digital ticket per attendee, each with its own scannable QR code. These tickets are:

- Emailed immediately to the buyer's email address as a downloadable PDF attachment and a link to view them online.
- Available at any time afterward from the customer's Ticket Buddy account dashboard, where they can be re-downloaded or re-sent by email.

Delivery time: digital tickets are generated and emailed within moments of payment confirmation. If a ticket email does not arrive within 15 minutes, check your spam folder, then use the "Resend tickets" option in your account dashboard or contact us at ${SUPPORT_EMAIL}.

There are no shipping fees, and no physical/postal delivery option is offered or required, since all tickets are entirely digital.`,
  },
  {
    slug: "terms",
    title: "Terms and Conditions",
    content: `By purchasing a ticket through Ticket Buddy, you agree to the specific terms of the event you're attending (shown on each event page) as well as these general platform terms:

- Tickets are issued to the named attendee and are not to be resold above face value.
- Ticket Buddy acts as a ticketing platform on behalf of independent event organizers (such as Actual Wala Live) and is not itself the organizer of most listed events.
- Entry to an event may be refused if a ticket is found to be fraudulent, duplicated, or in violation of an event's specific entry requirements.
- All prices displayed on Ticket Buddy are in Pakistani Rupees (PKR) and are inclusive of any applicable service fees shown at checkout.
- Payments are processed through JazzCash. By completing a payment, you also agree to JazzCash's own terms of service for the payment method you use.
- Ticket Buddy is operated from 604 N Block, Samanabad, Lahore, Pakistan. For questions about these terms, contact ${SUPPORT_EMAIL}.`,
  },
  {
    slug: "privacy",
    title: "Privacy Policy",
    content: `We collect the information you provide when browsing and booking events on Ticket Buddy — including buyer and attendee details (name, email, phone number, and any event-specific information requested by the organizer) — to process your booking, generate your tickets, and communicate with you about the event.

Payment information: Ticket Buddy does not collect, store, or process your card number, JazzCash wallet PIN, or CVV. Payment details are entered directly on JazzCash's own secure payment page, and Ticket Buddy only receives confirmation of whether the payment succeeded, along with a transaction reference number.

We do not sell your personal information. Event organizers receive attendee information necessary to run their event (name, ticket type, check-in status) but do not receive your full payment details.

Business contact: Ticket Buddy, 604 N Block, Samanabad, Lahore, Pakistan — ${SUPPORT_EMAIL} — ${SUPPORT_PHONE}.`,
  },
];

async function main() {
  for (const page of pages) {
    await prisma.page.upsert({
      where: { slug: page.slug },
      update: { title: page.title, content: page.content },
      create: page,
    });
    console.log("Updated page:", page.slug);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

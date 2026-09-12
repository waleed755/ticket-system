import { PrismaClient } from "@prisma/client";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();

async function main() {
  const event = await prisma.event.findUniqueOrThrow({
    where: { slug: "actual-wala-live-adnan-dhool-live-in-concert" },
    include: { ticketCategories: true },
  });

  const timezone = "Asia/Karachi";
  const startAt = fromZonedTime("2026-09-26T19:00:00", timezone); // 7:00 PM
  const endAt = fromZonedTime("2026-09-26T23:30:00", timezone); // 11:30 PM
  const bookingEndAt = fromZonedTime("2026-09-26T18:00:00", timezone);

  await prisma.event.update({
    where: { id: event.id },
    data: {
      shortDescription: "Real Voices. Real Music. Actual Live. — Adnan Dhool performs live at Fatima Jinnah Park, Sialkot Cantt.",
      fullDescription:
        "ACTUAL WALA LIVE presents Adnan Dhool Live in Concert — \"Real Voices. Real Music. Actual Live.\"\n\nSialkot, get ready for a night you'll never forget! Join fellow music lovers at Fatima Jinnah Park, Sialkot Cantt for an electrifying live performance featuring powerful vocals, crowd-favourite music, and an unforgettable concert atmosphere.\n\nChoose from Premium Front Seating, Reserved Seating, a dedicated Family & Ladies section, or the high-energy Stags/Single Male enclosure. Early bird pricing (Rs. 500 off) is available on the first 30% of tickets in each enclosure — book early to save. Army officers and their families are eligible for up to 50% off — contact support with your service ID to receive a discount code before booking.\n\nSialkot Sounds Better Together.",
      venueName: "Fatima Jinnah Park",
      addressLine1: "Fatima Jinnah Park",
      addressLine2: "Sialkot Cantt",
      city: "Sialkot",
      region: "Punjab",
      country: "Pakistan",
      timezone,
      startAt,
      endAt,
      bookingEndAt,
      capacity: 1400,
      organizerName: "Actual Wala Live",
      organizerEmail: "tickets@ticketbuddy.pk",
      organizerBio: "Actual Wala Live produces live concerts and cultural events across Punjab — real voices, real music, actual live.",
      entryRequirements: "Valid ticket (digital or printed) and government-issued photo ID required for entry. Wristbands issued at gate must be worn at all times.",
      ageRestriction: "All ages welcome. Under-16s must be accompanied by an adult.",
      refundDeadlineHours: 48,
      refundPolicy:
        "Full refunds are available up until 48 hours before the event start time (7:00 PM, September 26, 2026). Refund requests after this window, or after check-in, cannot be accepted. See our full Refund & Cancellation Policy for details.",
      termsAndConditions:
        "Tickets are non-transferable resale above face value is prohibited. Entry may be refused for fraudulent, duplicated, or previously used tickets. Event lineup, timing, and enclosures are subject to change; material changes will be communicated to ticket holders by email. Photography and video recording will take place throughout the venue for promotional purposes.",
      featured: true,
      waitlistEnabled: true,
      confirmationMessage: "You're in! Please arrive at least 45 minutes before showtime for entry screening. Bring a valid photo ID and your ticket (digital or printed).",
      faqs: {
        deleteMany: {},
        create: [
          {
            question: "Is there a discount for Army officers and their families?",
            answer: "Yes — Army officers and their families are eligible for up to 50% off. Contact support at tickets@ticketbuddy.pk with your service ID before booking to receive a verified discount code.",
            position: 0,
          },
          {
            question: "How does early bird pricing work?",
            answer: "The first 30% of tickets released in each enclosure (VIP Rows 1-4, VIP Rows 5-10, Family & Ladies, and Stags/Single Male) are priced Rs. 500 below the regular price. Once that allocation sells out, remaining tickets in that enclosure move to regular pricing automatically.",
            position: 1,
          },
          {
            question: "What is the Family & Ladies section?",
            answer: "A dedicated, comfortable enclosure reserved for families and women attendees, separate from the general Stags/Single Male crowd.",
            position: 2,
          },
          {
            question: "What time should I arrive?",
            answer: "Gates open at 5:00 PM. We recommend arriving by 6:15 PM to clear entry screening comfortably before the 7:00 PM start.",
            position: 3,
          },
        ],
      },
    },
  });

  // Remove the old placeholder ticket categories.
  await prisma.ticketCategory.deleteMany({ where: { eventId: event.id } });

  const tiers = [
    { name: "VIP Rows (1-4)", description: "Premium front seating, closest to the stage.", regular: 450000, earlyBird: 400000, total: 100 },
    { name: "VIP Rows (5-10)", description: "Reserved seating.", regular: 350000, earlyBird: 300000, total: 300 },
    { name: "Family & Ladies", description: "Dedicated section for families and women attendees.", regular: 200000, earlyBird: 150000, total: 400 },
    { name: "Stags / Single Male", description: "General standing, vibrant crowd section.", regular: 250000, earlyBird: 200000, total: 600 },
  ];

  let position = 0;
  for (const tier of tiers) {
    const earlyBirdQty = Math.round(tier.total * 0.3);
    const regularQty = tier.total - earlyBirdQty;

    await prisma.ticketCategory.create({
      data: {
        eventId: event.id,
        name: `${tier.name} — Early Bird`,
        description: `${tier.description} Early bird price — limited to the first ${earlyBirdQty} tickets in this enclosure.`,
        price: tier.earlyBird,
        currency: "PKR",
        totalQuantity: earlyBirdQty,
        minPerOrder: 1,
        maxPerOrder: 10,
        refundEligible: true,
        benefits: tier.description,
        status: "ACTIVE",
        position: position++,
      },
    });
    await prisma.ticketCategory.create({
      data: {
        eventId: event.id,
        name: tier.name,
        description: `${tier.description} Regular price.`,
        price: tier.regular,
        currency: "PKR",
        totalQuantity: regularQty,
        minPerOrder: 1,
        maxPerOrder: 10,
        refundEligible: true,
        benefits: tier.description,
        status: "ACTIVE",
        position: position++,
      },
    });
  }

  // Discount code for verified Army officers/families (distributed manually by support after ID verification).
  await prisma.discountCode.upsert({
    where: { code: "ARMY50" },
    update: { active: true, value: 50, type: "PERCENTAGE" },
    create: {
      code: "ARMY50",
      description: "50% off for verified Army officers and their families (Actual Wala Live concert).",
      type: "PERCENTAGE",
      value: 50,
      perCustomerLimit: 1,
      active: true,
      eventLinks: { create: [{ eventId: event.id }] },
    },
  });

  console.log("Event updated:", event.slug);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { customAlphabet } from "nanoid";
import { fromZonedTime } from "date-fns-tz";

const prisma = new PrismaClient();
const numeric = customAlphabet("0123456789", 6);
const alphaNumeric = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 10);
const codeAlphabet = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 24);

function bookingNumber() {
  return `BK-2601-${numeric()}`;
}
function ticketNumber() {
  return `TKT-${alphaNumeric()}`;
}
function secureCode() {
  return codeAlphabet();
}
function paymentRef() {
  return `PAY-${customAlphabet("0123456789ABCDEFGHJKLMNPQRSTUVWXYZ", 14)()}`;
}

function daysFromNow(days: number, hour = 18, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

// Builds the UTC instant for a given wall-clock date/time as observed in the
// supplied IANA timezone, so event start/end times display correctly (e.g.
// "10:00 AM" in Chicago) regardless of the machine timezone running the seed.
function zonedDaysFromNow(days: number, hour: number, minute: number, timezone: string) {
  const base = new Date();
  base.setDate(base.getDate() + days);
  const y = base.getFullYear();
  const m = String(base.getMonth() + 1).padStart(2, "0");
  const d = String(base.getDate()).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${y}-${m}-${d}T${hh}:${mm}:00`, timezone);
}

async function main() {
  console.log("Seeding database...");

  // ---------------------------------------------------------------------
  // Staff users
  // ---------------------------------------------------------------------
  const password = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.create({
    data: { email: "admin@gatherly.events", passwordHash: password, role: "ADMIN", fullName: "Dana Whitfield", status: "ACTIVE" },
  });
  const eventManager = await prisma.user.create({
    data: { email: "sarah.manager@gatherly.events", passwordHash: password, role: "EVENT_MANAGER", fullName: "Sarah Kim", status: "ACTIVE" },
  });
  const bookingManager = await prisma.user.create({
    data: { email: "james.bookings@gatherly.events", passwordHash: password, role: "BOOKING_MANAGER", fullName: "James Ortiz", status: "ACTIVE" },
  });
  const financeManager = await prisma.user.create({
    data: { email: "priya.finance@gatherly.events", passwordHash: password, role: "FINANCE_MANAGER", fullName: "Priya Nair", status: "ACTIVE" },
  });
  const support = await prisma.user.create({
    data: { email: "tom.support@gatherly.events", passwordHash: password, role: "SUPPORT", fullName: "Tom Reilly", status: "ACTIVE" },
  });
  const checkinStaff = await prisma.user.create({
    data: { email: "mike.checkin@gatherly.events", passwordHash: password, role: "CHECKIN_STAFF", fullName: "Mike Chen", status: "ACTIVE" },
  });
  const checkinStaff2 = await prisma.user.create({
    data: { email: "lucia.checkin@gatherly.events", passwordHash: password, role: "CHECKIN_STAFF", fullName: "Lucia Fernandez", status: "ACTIVE" },
  });

  // ---------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------
  const [catConference, catMusic, catComedy, catWebinar, catWellness] = await Promise.all([
    prisma.eventCategory.create({ data: { name: "Conference", slug: "conference" } }),
    prisma.eventCategory.create({ data: { name: "Music", slug: "music" } }),
    prisma.eventCategory.create({ data: { name: "Comedy", slug: "comedy" } }),
    prisma.eventCategory.create({ data: { name: "Webinar", slug: "webinar" } }),
    prisma.eventCategory.create({ data: { name: "Wellness", slug: "wellness" } }),
  ]);

  // ---------------------------------------------------------------------
  // Event 1: Global AI Summit 2026 — physical, multi-day, paid
  // ---------------------------------------------------------------------
  const aiSummit = await prisma.event.create({
    data: {
      slug: "global-ai-summit-2026",
      name: "Global AI Summit 2026",
      shortDescription: "Three days of keynotes, workshops, and networking with the leaders shaping applied AI.",
      fullDescription:
        "Global AI Summit brings together researchers, founders, and enterprise practitioners for three days of keynotes, hands-on workshops, and a dedicated startup showcase. Expect deep dives on applied machine learning, responsible AI deployment, and where the industry is heading next. Includes catered lunches, an evening networking reception, and access to the on-site expo hall featuring 40+ exhibitors.",
      categoryId: catConference.id,
      coverImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
      format: "PHYSICAL",
      venueName: "McCormick Place Convention Center",
      addressLine1: "2301 S King Dr",
      city: "Chicago",
      region: "IL",
      country: "USA",
      postalCode: "60616",
      mapUrl: "https://maps.google.com/?q=McCormick+Place+Chicago",
      startAt: zonedDaysFromNow(45, 8, 0, "America/Chicago"),
      endAt: zonedDaysFromNow(47, 18, 0, "America/Chicago"),
      timezone: "America/Chicago",
      capacity: 1200,
      bookingStartAt: daysFromNow(-30),
      bookingEndAt: daysFromNow(44),
      refundDeadlineHours: 48,
      refundPolicy:
        "Full refunds are available up until 48 hours before the event starts. After that window, tickets are non-refundable but may be transferred by contacting support.",
      termsAndConditions:
        "Attendees must be 18+. Badges are non-transferable once printed. Photography and recording will occur throughout the venue for promotional purposes.",
      ageRestriction: "18+",
      entryRequirements: "Government-issued photo ID required for badge pickup.",
      organizerName: "Gatherly Inc.",
      organizerEmail: "organizer@gatherly.events",
      organizerBio: "Producing premier technology conferences since 2015.",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      featured: true,
      waitlistEnabled: true,
      confirmationMessage: "You're in! Your badge will be ready for pickup at registration starting Day 1, 7:30 AM.",
      createdById: eventManager.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200", position: 0, altText: "Main stage" },
          { url: "https://images.unsplash.com/photo-1591115765373-5207764f72e7?w=1200", position: 1, altText: "Workshop room" },
          { url: "https://images.unsplash.com/photo-1531482615713-2afd69097998?w=1200", position: 2, altText: "Networking reception" },
        ],
      },
      faqs: {
        create: [
          { question: "Is parking available on-site?", answer: "Yes, discounted event parking is available at the McCormick Place garages — validate your ticket at registration.", position: 0 },
          { question: "Can I get a receipt for my company?", answer: "Yes, a detailed payment receipt is available for download from your account dashboard immediately after booking.", position: 1 },
          { question: "Is the summit recorded?", answer: "Keynote sessions are recorded and shared with all attendees after the event; workshop sessions are not recorded.", position: 2 },
        ],
      },
      questions: {
        create: [
          { label: "Company / Organization", type: "TEXT", required: true, position: 0 },
          { label: "Job Title", type: "TEXT", required: false, position: 1 },
          { label: "Which track are you most interested in?", type: "SELECT", options: JSON.stringify(["Applied ML", "Responsible AI", "Startup Showcase", "Enterprise Deployment"]), required: false, position: 2 },
        ],
      },
      assignments: { create: [{ userId: eventManager.id, role: "EVENT_MANAGER" }, { userId: checkinStaff.id, role: "CHECKIN_STAFF" }] },
    },
  });

  const aiGA = await prisma.ticketCategory.create({
    data: { eventId: aiSummit.id, name: "General Admission", description: "Full 3-day access to all keynotes, workshops, and the expo hall.", price: 4500000, totalQuantity: 700, minPerOrder: 1, maxPerOrder: 8, refundEligible: true, benefits: "All sessions, expo hall, catered lunches", status: "ACTIVE", position: 0 },
  });
  const aiVIP = await prisma.ticketCategory.create({
    data: { eventId: aiSummit.id, name: "VIP Pass", description: "GA benefits plus front-row seating, speaker meet & greet, and VIP lounge access.", price: 9500000, totalQuantity: 150, minPerOrder: 1, maxPerOrder: 4, refundEligible: true, benefits: "Everything in GA + VIP lounge + speaker meet & greet", status: "ACTIVE", position: 1 },
  });
  const aiStudent = await prisma.ticketCategory.create({
    data: { eventId: aiSummit.id, name: "Student", description: "Discounted access for full-time students with valid ID.", price: 1500000, totalQuantity: 200, minPerOrder: 1, maxPerOrder: 2, refundEligible: true, benefits: "All sessions, expo hall", status: "ACTIVE", position: 2 },
  });
  await prisma.ticketCategory.create({
    data: { eventId: aiSummit.id, name: "Early Bird (Closed)", description: "Early bird pricing — sale window has ended.", price: 3000000, totalQuantity: 100, quantitySold: 100, minPerOrder: 1, maxPerOrder: 4, saleEndAt: daysFromNow(-5), refundEligible: true, status: "SOLD_OUT", position: 3 },
  });

  // ---------------------------------------------------------------------
  // Event 2: Riverside Music Festival — physical, multi-day, paid, almost sold out
  // ---------------------------------------------------------------------
  const musicFest = await prisma.event.create({
    data: {
      slug: "riverside-music-festival-2026",
      name: "Riverside Music Festival",
      shortDescription: "A two-day outdoor festival featuring 30+ artists across four stages on the riverfront.",
      fullDescription:
        "Riverside Music Festival returns for its sixth year with two full days of live music across four stages, food trucks from Austin's best local vendors, and art installations along the riverfront walk. Headliners will be announced on a rolling basis — early ticket holders get first access to lineup drops.",
      categoryId: catMusic.id,
      coverImage: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200",
      format: "PHYSICAL",
      venueName: "Riverside Park Amphitheater",
      addressLine1: "800 Riverside Dr",
      city: "Austin",
      region: "TX",
      country: "USA",
      postalCode: "78704",
      mapUrl: "https://maps.google.com/?q=Riverside+Park+Austin",
      startAt: zonedDaysFromNow(20, 14, 0, "America/Chicago"),
      endAt: zonedDaysFromNow(21, 23, 0, "America/Chicago"),
      timezone: "America/Chicago",
      capacity: 60,
      bookingStartAt: daysFromNow(-60),
      bookingEndAt: daysFromNow(19),
      refundDeadlineHours: 48,
      refundPolicy: "Tickets are refundable up to 48 hours before gates open. No refunds for weather-related delays once the festival has started.",
      termsAndConditions: "No outside food, drinks, or professional cameras. Re-entry allowed with wristband.",
      ageRestriction: "All ages (alcohol areas 21+)",
      entryRequirements: "Wristband required for entry — issued at will-call with your ticket QR code.",
      organizerName: "Riverside Live Presents",
      organizerEmail: "info@riversidelive.com",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      featured: true,
      waitlistEnabled: true,
      createdById: admin.id,
      images: {
        create: [
          { url: "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=1200", position: 0 },
          { url: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200", position: 1 },
        ],
      },
      faqs: { create: [{ question: "Can I bring my own chair?", answer: "Low-back lawn chairs are permitted in the general admission lawn area only.", position: 0 }] },
    },
  });
  const musicGA = await prisma.ticketCategory.create({
    data: { eventId: musicFest.id, name: "2-Day GA", description: "General admission, both days.", price: 1250000, totalQuantity: 40, quantitySold: 33, minPerOrder: 1, maxPerOrder: 6, refundEligible: true, status: "ACTIVE", position: 0 },
  });
  const musicVIP = await prisma.ticketCategory.create({
    data: { eventId: musicFest.id, name: "VIP 2-Day", description: "Elevated viewing platform, air-conditioned lounge, private bars.", price: 3000000, totalQuantity: 15, quantitySold: 13, minPerOrder: 1, maxPerOrder: 4, refundEligible: true, status: "ACTIVE", position: 1 },
  });
  await prisma.ticketCategory.create({
    data: { eventId: musicFest.id, name: "Single Day — Saturday", price: 750000, totalQuantity: 5, quantitySold: 5, minPerOrder: 1, maxPerOrder: 6, refundEligible: true, status: "SOLD_OUT", position: 2 },
  });

  // ---------------------------------------------------------------------
  // Event 3: Stand-Up Spectacular — physical, single evening
  // ---------------------------------------------------------------------
  const comedyNight = await prisma.event.create({
    data: {
      slug: "standup-spectacular-late-night-laughs",
      name: "Stand-Up Spectacular: Late Night Laughs",
      shortDescription: "An unforgettable night of stand-up comedy featuring five touring headliners.",
      fullDescription:
        "Join us for one night only as five nationally touring comedians take the stage back-to-back for a fast-paced, no-filler night of stand-up. Doors open at 7, show starts at 8 sharp. Full bar available inside the venue.",
      categoryId: catComedy.id,
      coverImage: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200",
      format: "PHYSICAL",
      venueName: "The Laugh Track Theater",
      addressLine1: "145 W 42nd St",
      city: "New York",
      region: "NY",
      country: "USA",
      postalCode: "10036",
      startAt: zonedDaysFromNow(6, 20, 0, "America/New_York"),
      endAt: zonedDaysFromNow(6, 22, 30, "America/New_York"),
      timezone: "America/New_York",
      capacity: 15,
      bookingStartAt: daysFromNow(-20),
      bookingEndAt: daysFromNow(6),
      refundDeadlineHours: 48,
      refundPolicy: "Full refunds up to 48 hours before showtime. This event is popular and frequently sells out — refunded tickets are resold quickly.",
      termsAndConditions: "21+ event. Two-drink minimum applies inside the venue. Content may include mature language.",
      ageRestriction: "21+",
      entryRequirements: "Valid photo ID required at the door.",
      organizerName: "Laugh Track Presents",
      organizerEmail: "shows@laughtracktheater.com",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      featured: true,
      createdById: admin.id,
      images: { create: [{ url: "https://images.unsplash.com/photo-1585699324551-f6c309eedeca?w=1200", position: 0 }] },
      assignments: { create: [{ userId: checkinStaff.id, role: "CHECKIN_STAFF" }, { userId: checkinStaff2.id, role: "CHECKIN_STAFF" }] },
    },
  });
  const comedyGA = await prisma.ticketCategory.create({
    data: { eventId: comedyNight.id, name: "General Admission", price: 250000, totalQuantity: 12, quantitySold: 9, minPerOrder: 1, maxPerOrder: 6, refundEligible: true, status: "ACTIVE", position: 0 },
  });
  const comedyFront = await prisma.ticketCategory.create({
    data: { eventId: comedyNight.id, name: "Front Row", description: "Reserved seating in the first two rows.", price: 450000, totalQuantity: 3, quantitySold: 2, minPerOrder: 1, maxPerOrder: 2, refundEligible: true, status: "ACTIVE", position: 1 },
  });

  // ---------------------------------------------------------------------
  // Event 4: The Future of Remote Work — online, free
  // ---------------------------------------------------------------------
  const webinar = await prisma.event.create({
    data: {
      slug: "future-of-remote-work-webinar",
      name: "The Future of Remote Work",
      shortDescription: "A free live panel discussion on distributed teams, async culture, and the tools reshaping how we work.",
      fullDescription:
        "Join three operating leaders from fast-growing remote-first companies for an hour-long panel on what's actually working (and what isn't) in distributed teams today. Live Q&A follows the panel discussion. A recording will be sent to all registrants afterward.",
      categoryId: catWebinar.id,
      coverImage: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200",
      format: "ONLINE",
      onlineUrl: "https://meet.gatherly.events/future-of-remote-work",
      onlineInstructions: "Join link will be emailed 1 hour before the session and is also available in your account dashboard.",
      startAt: zonedDaysFromNow(9, 12, 0, "America/New_York"),
      endAt: zonedDaysFromNow(9, 13, 0, "America/New_York"),
      timezone: "America/New_York",
      capacity: 500,
      bookingStartAt: daysFromNow(-15),
      bookingEndAt: daysFromNow(9),
      refundDeadlineHours: 48,
      refundPolicy: "This is a free event — no payment or refund applicable. You may cancel your registration any time from your dashboard.",
      termsAndConditions: "This session will be recorded. By registering you consent to being visible in the live chat/Q&A panel if you choose to participate.",
      organizerName: "Gatherly Inc.",
      organizerEmail: "webinars@gatherly.events",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      featured: false,
      createdById: eventManager.id,
      images: { create: [{ url: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=1200", position: 0 }] },
    },
  });
  const webinarFree = await prisma.ticketCategory.create({
    data: { eventId: webinar.id, name: "Free Registration", price: 0, totalQuantity: 500, minPerOrder: 1, maxPerOrder: 5, refundEligible: false, status: "ACTIVE", position: 0 },
  });

  // ---------------------------------------------------------------------
  // Event 5: Sunset Yoga & Wellness Retreat — hybrid, small capacity
  // ---------------------------------------------------------------------
  const wellness = await prisma.event.create({
    data: {
      slug: "sunset-yoga-wellness-retreat",
      name: "Sunset Yoga & Wellness Retreat",
      shortDescription: "A half-day in-person and livestreamed retreat with guided yoga, breathwork, and a sound bath.",
      fullDescription:
        "Unplug for a half-day of guided vinyasa yoga, breathwork, and a closing sound bath meditation, led by certified instructors. Join us in person on the rooftop terrace or follow along live from home — both experiences include the same guided sessions in real time.",
      categoryId: catWellness.id,
      coverImage: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200",
      format: "HYBRID",
      venueName: "Skyline Rooftop Studio",
      addressLine1: "500 Ocean Ave",
      city: "San Diego",
      region: "CA",
      country: "USA",
      postalCode: "92109",
      onlineUrl: "https://meet.gatherly.events/sunset-yoga",
      startAt: zonedDaysFromNow(13, 17, 0, "America/Los_Angeles"),
      endAt: zonedDaysFromNow(13, 20, 0, "America/Los_Angeles"),
      timezone: "America/Los_Angeles",
      capacity: 45,
      bookingStartAt: daysFromNow(-10),
      bookingEndAt: daysFromNow(13),
      refundDeadlineHours: 48,
      refundPolicy: "Full refund up to 48 hours before the session begins.",
      termsAndConditions: "Bring your own mat for in-person attendance. Livestream attendees should have a mat and quiet space at home.",
      organizerName: "Skyline Wellness Collective",
      organizerEmail: "hello@skylinewellness.com",
      status: "PUBLISHED",
      visibility: "PUBLIC",
      createdById: admin.id,
      images: { create: [{ url: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200", position: 0 }] },
    },
  });
  await prisma.ticketCategory.create({
    data: { eventId: wellness.id, name: "In-Person", price: 350000, totalQuantity: 30, quantitySold: 11, minPerOrder: 1, maxPerOrder: 4, refundEligible: true, status: "ACTIVE", position: 0 },
  });
  await prisma.ticketCategory.create({
    data: { eventId: wellness.id, name: "Livestream", price: 150000, totalQuantity: 15, quantitySold: 3, minPerOrder: 1, maxPerOrder: 4, refundEligible: true, status: "ACTIVE", position: 1 },
  });

  // ---------------------------------------------------------------------
  // Event 6: Founders Circle Dinner — private, access-code protected
  // ---------------------------------------------------------------------
  const privateDinner = await prisma.event.create({
    data: {
      slug: "founders-circle-dinner-2026",
      name: "Founders Circle Dinner",
      shortDescription: "An invite-only dinner for portfolio founders.",
      fullDescription: "A private, invite-only dinner for our portfolio founders and select guests. Access code required.",
      categoryId: catConference.id,
      coverImage: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200",
      format: "PHYSICAL",
      venueName: "The Wharton Room",
      addressLine1: "12 Beacon St",
      city: "Boston",
      region: "MA",
      country: "USA",
      startAt: zonedDaysFromNow(30, 19, 0, "America/New_York"),
      endAt: zonedDaysFromNow(30, 22, 0, "America/New_York"),
      timezone: "America/New_York",
      capacity: 40,
      bookingStartAt: daysFromNow(-5),
      bookingEndAt: daysFromNow(29),
      refundDeadlineHours: 48,
      refundPolicy: "Full refund up to 48 hours before the event.",
      termsAndConditions: "Access restricted to invited guests only.",
      organizerName: "Highline Capital Partners",
      organizerEmail: "events@highlinecapital.com",
      status: "PUBLISHED",
      visibility: "PRIVATE",
      accessCode: "FOUNDERS26",
      createdById: admin.id,
    },
  });
  await prisma.ticketCategory.create({
    data: { eventId: privateDinner.id, name: "Guest Seat", price: 0, totalQuantity: 40, minPerOrder: 1, maxPerOrder: 2, refundEligible: true, status: "ACTIVE", position: 0 },
  });

  // ---------------------------------------------------------------------
  // Draft + Archived + Cancelled events (for admin views)
  // ---------------------------------------------------------------------
  await prisma.event.create({
    data: {
      slug: "winter-tech-mixer-draft",
      name: "Winter Tech Mixer",
      shortDescription: "A casual networking mixer for the local tech community.",
      fullDescription: "Planning in progress — details coming soon.",
      categoryId: catConference.id,
      coverImage: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200",
      format: "PHYSICAL",
      venueName: "TBD",
      city: "Chicago",
      startAt: zonedDaysFromNow(70, 18, 0, "America/Chicago"),
      endAt: zonedDaysFromNow(70, 21, 0, "America/Chicago"),
      timezone: "America/Chicago",
      capacity: 150,
      bookingStartAt: daysFromNow(10),
      bookingEndAt: daysFromNow(69),
      refundPolicy: "Full refund up to 48 hours before the event.",
      termsAndConditions: "Details to be finalized.",
      organizerName: "Gatherly Inc.",
      organizerEmail: "organizer@gatherly.events",
      status: "DRAFT",
      visibility: "PUBLIC",
      createdById: eventManager.id,
    },
  });

  const cancelledEvent = await prisma.event.create({
    data: {
      slug: "spring-food-truck-rally-cancelled",
      name: "Spring Food Truck Rally",
      shortDescription: "A weekend rally of the city's best food trucks.",
      fullDescription: "This event has been cancelled by the organizer.",
      categoryId: catMusic.id,
      coverImage: "https://images.unsplash.com/photo-1565123409695-7b5ef63a2efb?w=1200",
      format: "PHYSICAL",
      venueName: "Central Plaza",
      city: "Denver",
      startAt: zonedDaysFromNow(15, 11, 0, "America/Denver"),
      endAt: zonedDaysFromNow(16, 20, 0, "America/Denver"),
      timezone: "America/Denver",
      capacity: 300,
      bookingStartAt: daysFromNow(-40),
      bookingEndAt: daysFromNow(14),
      refundPolicy: "Full refund up to 48 hours before the event.",
      termsAndConditions: "N/A",
      organizerName: "Denver Street Eats",
      organizerEmail: "info@denverstreeteats.com",
      status: "CANCELLED",
      visibility: "PUBLIC",
      cancelledAt: new Date(),
      cancelledReason: "Venue permit was revoked due to construction delays on Central Plaza.",
      createdById: admin.id,
    },
  });
  await prisma.ticketCategory.create({
    data: { eventId: cancelledEvent.id, name: "General Admission", price: 80000, totalQuantity: 300, quantitySold: 0, status: "CLOSED", position: 0 },
  });

  // ---------------------------------------------------------------------
  // Discount codes
  // ---------------------------------------------------------------------
  const earlyBird = await prisma.discountCode.create({
    data: {
      code: "EARLYBIRD10",
      description: "10% off Global AI Summit",
      type: "PERCENTAGE",
      value: 10,
      usageLimit: 200,
      perCustomerLimit: 1,
      active: true,
      eventLinks: { create: [{ eventId: aiSummit.id }] },
    },
  });
  await prisma.discountCode.create({
    data: {
      code: "SAVE1000",
      description: "Rs 1,000 off Riverside Music Festival GA",
      type: "FIXED",
      value: 100000,
      usageLimit: 100,
      perCustomerLimit: 1,
      minOrderAmount: 500000,
      active: true,
      eventLinks: { create: [{ eventId: musicFest.id }] },
      categoryLinks: { create: [{ ticketCategoryId: musicGA.id }] },
    },
  });
  await prisma.discountCode.create({
    data: { code: "WELCOME", description: "5% off any event, sitewide", type: "PERCENTAGE", value: 5, perCustomerLimit: 1, active: true },
  });
  await prisma.discountCode.create({
    data: { code: "EXPIRED2025", description: "Expired promo", type: "PERCENTAGE", value: 15, endAt: daysFromNow(-30), active: false },
  });

  // ---------------------------------------------------------------------
  // Sample customers with realistic bookings/payments/tickets/refunds
  // ---------------------------------------------------------------------

  // Customer 1: fully activated, confirmed booking, 3 attendees, AI Summit GA
  const customer1 = await prisma.user.create({
    data: { email: "hannah.brooks@example.com", passwordHash: password, role: "CUSTOMER", fullName: "Hannah Brooks", phone: "+1 312 555 0142", status: "ACTIVE" },
  });
  const booking1 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: aiSummit.id,
      customerId: customer1.id,
      buyerName: "Hannah Brooks",
      buyerEmail: customer1.email,
      buyerPhone: "+1 312 555 0142",
      status: "CONFIRMED",
      subtotal: 4500000 * 3,
      totalAmount: Math.round(4500000 * 3 * 1.03) + 10000,
      feeAmount: Math.round(4500000 * 3 * 0.03) + 10000,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-12),
      createdAt: daysFromNow(-12),
      attendees: {
        create: [
          { ticketCategoryId: aiGA.id, fullName: "Hannah Brooks", email: customer1.email, isBuyer: true, customAnswers: JSON.stringify({}) },
          { ticketCategoryId: aiGA.id, fullName: "Derek Brooks", email: "derek.brooks@example.com" },
          { ticketCategoryId: aiGA.id, fullName: "Nia Patel", email: "nia.patel@example.com" },
        ],
      },
    },
    include: { attendees: true },
  });
  await prisma.payment.create({
    data: { bookingId: booking1.id, amount: booking1.totalAmount, currency: "PKR", status: "SUCCEEDED", method: "test_card", reference: paymentRef(), cardLast4: "4242", cardBrand: "Visa", succeededAt: daysFromNow(-12) },
  });
  for (const attendee of booking1.attendees) {
    await prisma.ticket.create({
      data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking1.id, attendeeId: attendee.id, eventId: aiSummit.id, ticketCategoryId: aiGA.id, status: "VALID", price: aiGA.price },
    });
  }

  // Customer 2: activated, confirmed booking with 1 checked-in ticket (comedy night, past-tense scenario simulated)
  const customer2 = await prisma.user.create({
    data: { email: "marcus.lee@example.com", passwordHash: password, role: "CUSTOMER", fullName: "Marcus Lee", phone: "+1 646 555 0110", status: "ACTIVE" },
  });
  const booking2 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: comedyNight.id,
      customerId: customer2.id,
      buyerName: "Marcus Lee",
      buyerEmail: customer2.email,
      buyerPhone: "+1 646 555 0110",
      status: "CONFIRMED",
      subtotal: 250000 * 2,
      totalAmount: Math.round(250000 * 2 * 1.03) + 10000,
      feeAmount: Math.round(250000 * 2 * 0.03) + 10000,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-3),
      createdAt: daysFromNow(-3),
      attendees: {
        create: [
          { ticketCategoryId: comedyGA.id, fullName: "Marcus Lee", email: customer2.email, isBuyer: true },
          { ticketCategoryId: comedyGA.id, fullName: "Ava Lee", email: "ava.lee@example.com" },
        ],
      },
    },
    include: { attendees: true },
  });
  const payment2 = await prisma.payment.create({
    data: { bookingId: booking2.id, amount: booking2.totalAmount, currency: "PKR", status: "SUCCEEDED", method: "test_card", reference: paymentRef(), cardLast4: "4242", cardBrand: "Visa", succeededAt: daysFromNow(-3) },
  });
  const t1 = await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking2.id, attendeeId: booking2.attendees[0].id, eventId: comedyNight.id, ticketCategoryId: comedyGA.id, status: "CHECKED_IN", price: comedyGA.price, checkedInAt: new Date(), checkedInById: checkinStaff.id },
  });
  await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking2.id, attendeeId: booking2.attendees[1].id, eventId: comedyNight.id, ticketCategoryId: comedyGA.id, status: "VALID", price: comedyGA.price },
  });

  // Customer 3: pending activation (bought once, never activated), free webinar registration
  const customer3 = await prisma.user.create({
    data: {
      email: "olivia.grant@example.com",
      role: "CUSTOMER",
      fullName: "Olivia Grant",
      status: "PENDING_ACTIVATION",
      activationToken: "demoActivationToken000001",
      activationTokenExpires: daysFromNow(6),
    },
  });
  const booking3 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: webinar.id,
      customerId: customer3.id,
      buyerName: "Olivia Grant",
      buyerEmail: customer3.email,
      status: "CONFIRMED",
      subtotal: 0,
      totalAmount: 0,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-1),
      createdAt: daysFromNow(-1),
      attendees: { create: [{ ticketCategoryId: webinarFree.id, fullName: "Olivia Grant", email: customer3.email, isBuyer: true }] },
    },
    include: { attendees: true },
  });
  await prisma.payment.create({
    data: { bookingId: booking3.id, amount: 0, currency: "PKR", status: "SUCCEEDED", method: "free", reference: paymentRef(), succeededAt: daysFromNow(-1) },
  });
  await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking3.id, attendeeId: booking3.attendees[0].id, eventId: webinar.id, ticketCategoryId: webinarFree.id, status: "VALID", price: 0 },
  });

  // Customer 4: activated, booking with a PENDING refund request (>48h out, eligible) on music festival
  const customer4 = await prisma.user.create({
    data: { email: "carlos.mendez@example.com", passwordHash: password, role: "CUSTOMER", fullName: "Carlos Mendez", phone: "+1 512 555 0198", status: "ACTIVE" },
  });
  const booking4 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: musicFest.id,
      customerId: customer4.id,
      buyerName: "Carlos Mendez",
      buyerEmail: customer4.email,
      buyerPhone: "+1 512 555 0198",
      status: "CONFIRMED",
      subtotal: 1250000 * 2,
      totalAmount: Math.round(1250000 * 2 * 1.03) + 10000,
      feeAmount: Math.round(1250000 * 2 * 0.03) + 10000,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-8),
      createdAt: daysFromNow(-8),
      attendees: {
        create: [
          { ticketCategoryId: musicGA.id, fullName: "Carlos Mendez", email: customer4.email, isBuyer: true },
          { ticketCategoryId: musicGA.id, fullName: "Elena Mendez", email: "elena.mendez@example.com" },
        ],
      },
    },
    include: { attendees: true },
  });
  const payment4 = await prisma.payment.create({
    data: { bookingId: booking4.id, amount: booking4.totalAmount, currency: "PKR", status: "SUCCEEDED", method: "test_card", reference: paymentRef(), cardLast4: "5454", cardBrand: "Mastercard", succeededAt: daysFromNow(-8) },
  });
  const ticket4a = await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking4.id, attendeeId: booking4.attendees[0].id, eventId: musicFest.id, ticketCategoryId: musicGA.id, status: "VALID", price: musicGA.price },
  });
  await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking4.id, attendeeId: booking4.attendees[1].id, eventId: musicFest.id, ticketCategoryId: musicGA.id, status: "VALID", price: musicGA.price },
  });
  await prisma.refund.create({
    data: {
      bookingId: booking4.id,
      paymentId: payment4.id,
      requestedById: customer4.id,
      requestedAmount: musicGA.price,
      reason: "Schedule conflict",
      additionalNotes: "I can no longer attend on the Saturday — can I get a refund for my +1's ticket only?",
      status: "PENDING",
      ticketLinks: { create: [{ ticketId: ticket4a.id }] },
    },
  });

  // Customer 5: activated, past booking with a COMPLETED refund on record
  const customer5 = await prisma.user.create({
    data: { email: "priya.desai@example.com", passwordHash: password, role: "CUSTOMER", fullName: "Priya Desai", phone: "+1 415 555 0176", status: "ACTIVE" },
  });
  const booking5 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: wellness.id,
      customerId: customer5.id,
      buyerName: "Priya Desai",
      buyerEmail: customer5.email,
      buyerPhone: "+1 415 555 0176",
      status: "FULLY_REFUNDED",
      subtotal: 350000,
      totalAmount: Math.round(350000 * 1.03) + 10000,
      feeAmount: Math.round(350000 * 0.03) + 10000,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-25),
      createdAt: daysFromNow(-25),
      attendees: { create: [{ ticketCategoryId: wellness.id ? (await prisma.ticketCategory.findFirstOrThrow({ where: { eventId: wellness.id, name: "In-Person" } })).id : "", fullName: "Priya Desai", email: customer5.email, isBuyer: true }] },
    },
    include: { attendees: true },
  });
  const payment5 = await prisma.payment.create({
    data: { bookingId: booking5.id, amount: booking5.totalAmount, currency: "PKR", status: "REFUNDED", method: "test_card", reference: paymentRef(), cardLast4: "1881", cardBrand: "Visa", succeededAt: daysFromNow(-25) },
  });
  const ticket5 = await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking5.id, attendeeId: booking5.attendees[0].id, eventId: wellness.id, ticketCategoryId: booking5.attendees[0].ticketCategoryId, status: "REFUNDED", price: 350000 },
  });
  await prisma.refund.create({
    data: {
      bookingId: booking5.id,
      paymentId: payment5.id,
      requestedById: customer5.id,
      decidedById: financeManager.id,
      requestedAmount: 350000,
      approvedAmount: 350000,
      reason: "Unable to attend",
      status: "COMPLETED",
      decidedAt: daysFromNow(-24),
      adminNotes: "Straightforward request, well within window.",
      customerMessage: "Refund processed to your original payment method — please allow 3-5 business days to appear.",
      ticketLinks: { create: [{ ticketId: ticket5.id }] },
    },
  });

  // Customer 6: a booking with a FAILED payment attempt then a successful retry (demonstrates retry flow in history)
  const customer6 = await prisma.user.create({
    data: { email: "grace.kim@example.com", passwordHash: password, role: "CUSTOMER", fullName: "Grace Kim", phone: "+1 773 555 0133", status: "ACTIVE" },
  });
  const booking6 = await prisma.booking.create({
    data: {
      bookingNumber: bookingNumber(),
      eventId: aiSummit.id,
      customerId: customer6.id,
      buyerName: "Grace Kim",
      buyerEmail: customer6.email,
      buyerPhone: "+1 773 555 0133",
      status: "CONFIRMED",
      subtotal: 1500000,
      totalAmount: Math.round(1500000 * 1.03) + 10000,
      feeAmount: Math.round(1500000 * 0.03) + 10000,
      currency: "PKR",
      termsAcceptedAt: daysFromNow(-2),
      createdAt: daysFromNow(-2),
      attendees: { create: [{ ticketCategoryId: aiStudent.id, fullName: "Grace Kim", email: customer6.email, isBuyer: true }] },
    },
    include: { attendees: true },
  });
  await prisma.payment.create({
    data: { bookingId: booking6.id, amount: booking6.totalAmount, currency: "PKR", status: "FAILED", method: "test_card", reference: paymentRef(), cardLast4: "0002", cardBrand: "Visa", failureReason: "Your card was declined by the issuing bank.", attemptedAt: daysFromNow(-2) },
  });
  await prisma.payment.create({
    data: { bookingId: booking6.id, amount: booking6.totalAmount, currency: "PKR", status: "SUCCEEDED", method: "test_card", reference: paymentRef(), cardLast4: "4242", cardBrand: "Visa", succeededAt: daysFromNow(-2) },
  });
  await prisma.ticket.create({
    data: { ticketNumber: ticketNumber(), secureCode: secureCode(), bookingId: booking6.id, attendeeId: booking6.attendees[0].id, eventId: aiSummit.id, ticketCategoryId: aiStudent.id, status: "VALID", price: aiStudent.price },
  });

  // Bump sold counters to reflect seeded bookings for events not already pre-set.
  await prisma.ticketCategory.update({ where: { id: aiGA.id }, data: { quantitySold: { increment: 3 } } });
  await prisma.ticketCategory.update({ where: { id: aiStudent.id }, data: { quantitySold: { increment: 1 } } });
  await prisma.ticketCategory.update({ where: { id: comedyGA.id }, data: { quantitySold: { increment: 2 } } });
  await prisma.ticketCategory.update({ where: { id: webinarFree.id }, data: { quantitySold: { increment: 1 } } });

  // ---------------------------------------------------------------------
  // Waitlist entries
  // ---------------------------------------------------------------------
  await prisma.waitlistEntry.create({ data: { eventId: comedyNight.id, ticketCategoryId: comedyFront.id, name: "Ben Sutton", email: "ben.sutton@example.com" } });
  await prisma.waitlistEntry.create({ data: { eventId: musicFest.id, ticketCategoryId: musicVIP.id, name: "Ravi Chandran", email: "ravi.c@example.com" } });

  // ---------------------------------------------------------------------
  // Reminder schedules
  // ---------------------------------------------------------------------
  for (const eventId of [aiSummit.id, musicFest.id, comedyNight.id]) {
    await prisma.reminderSchedule.createMany({
      data: [
        { eventId, label: "7 days before", offsetHoursBefore: 168 },
        { eventId, label: "2 days before", offsetHoursBefore: 48 },
        { eventId, label: "1 day before", offsetHoursBefore: 24 },
        { eventId, label: "Few hours before", offsetHoursBefore: 3 },
      ],
    });
  }

  // ---------------------------------------------------------------------
  // Site content
  // ---------------------------------------------------------------------
  await prisma.page.createMany({
    data: [
      {
        slug: "about",
        title: "About Gatherly",
        content:
          "Gatherly is a modern ticketing platform built for organizers who care about the details — from a smooth checkout to a check-in line that never backs up. Founded in 2021, we now power conferences, festivals, comedy nights, and community events for organizers across the country. Our mission is simple: make it effortless for people to discover events worth attending, and effortless for organizers to run them.",
      },
      {
        slug: "contact",
        title: "Contact & Support",
        content:
          "Have a question about an upcoming event, a booking, or a refund? Our support team typically responds within one business day. For urgent day-of-event issues, please contact the event organizer directly using the details on your ticket.",
      },
      {
        slug: "refund-policy",
        title: "Refund & Cancellation Policy",
        content:
          "Unless otherwise noted on a specific event page, tickets purchased through Gatherly may be refunded up until 48 hours before the event's scheduled start time. Refund requests submitted less than 48 hours before an event, after the event has started, or after the event has ended will not be accepted. Checked-in tickets are not eligible for refunds. If an event is cancelled or significantly rescheduled by its organizer, affected customers will be contacted directly with refund or credit options, which may fall outside the standard 48-hour window at the organizer's discretion.",
      },
      {
        slug: "terms",
        title: "Terms and Conditions",
        content:
          "By purchasing a ticket through Gatherly, you agree to the specific terms of the event you're attending (shown on each event page) as well as these general platform terms: tickets are issued to the named attendee and are not to be resold above face value; Gatherly acts as a ticketing platform on behalf of independent event organizers and is not itself the organizer of most listed events; entry to an event may be refused if a ticket is found to be fraudulent, duplicated, or in violation of an event's specific entry requirements.",
      },
      {
        slug: "privacy",
        title: "Privacy Policy",
        content:
          "We collect the information you provide when browsing and booking events — including buyer and attendee details — to process your booking, generate your tickets, and communicate with you about the event. We do not sell your personal information. Event organizers receive attendee information necessary to run their event (name, ticket type, check-in status) but do not receive full payment details, which are handled by our payment processing layer.",
      },
    ],
  });

  await prisma.siteFAQ.createMany({
    data: [
      { question: "Do I need to create an account to book tickets?", answer: "No — you can book as a guest using just your email address. An account is automatically created after your first successful booking so you can access your tickets any time.", position: 0 },
      { question: "How do I get my tickets?", answer: "Tickets are emailed to you immediately after a successful booking and are always available for download from your account dashboard.", position: 1 },
      { question: "What is your refund policy?", answer: "Tickets can be refunded up until 48 hours before an event starts. See our full Refund & Cancellation Policy for details.", position: 2 },
      { question: "Can I transfer my ticket to someone else?", answer: "Attendee name changes may be available depending on the event — check the event's FAQ section or contact support.", position: 3 },
      { question: "What happens if an event is cancelled?", answer: "You'll be notified by email immediately, and our team will process refunds or provide alternative options depending on the organizer's decision.", position: 4 },
    ],
  });

  await prisma.siteSetting.createMany({
    data: [
      { key: "support_email", value: "support@gatherly.events" },
      { key: "support_phone", value: "+1 (800) 555-0123" },
    ],
  });

  console.log("Seed complete.");
  console.log("Staff logins (password: Password123!):");
  console.log("  admin@gatherly.events (ADMIN)");
  console.log("  sarah.manager@gatherly.events (EVENT_MANAGER)");
  console.log("  james.bookings@gatherly.events (BOOKING_MANAGER)");
  console.log("  priya.finance@gatherly.events (FINANCE_MANAGER)");
  console.log("  tom.support@gatherly.events (SUPPORT)");
  console.log("  mike.checkin@gatherly.events (CHECKIN_STAFF)");
  console.log("Customer logins (password: Password123!): hannah.brooks@example.com, marcus.lee@example.com, carlos.mendez@example.com, priya.desai@example.com, grace.kim@example.com");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

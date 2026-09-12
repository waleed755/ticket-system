import Link from "next/link";
import { Container } from "@/components/ui";
import NewsletterForm from "@/components/site/newsletter-form";
import { prisma } from "@/lib/prisma";

export default async function Footer() {
  const settings = await prisma.siteSetting.findMany();
  const get = (key: string, fallback: string) => settings.find((s) => s.key === key)?.value ?? fallback;

  const email = get("support_email", "tickets@ticketbuddy.pk");
  const phone = get("support_phone", "0347 6581443");
  const phoneAlt = get("support_phone_alt", "0304 1549196");
  const address = get("business_address", "604 N Block, Samanabad, Lahore, Pakistan");

  return (
    <footer className="bg-gray-900 text-gray-300 mt-24">
      <Container className="py-14">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm">T</span>
              TicketBuddy.pk
            </div>
            <p className="text-sm text-gray-400 max-w-xs mb-4">
              Pakistan&apos;s ticketing platform for concerts, conferences, and live events — browse, book, and pay securely online.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Explore</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-white">All Events</Link></li>
              <li><Link href="/events?priceType=FREE" className="hover:text-white">Free Events</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
              <li><Link href="/how-it-works" className="hover:text-white">How It Works</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Support</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white">Shipping / Delivery Policy</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link href="/login" className="hover:text-white">Staff Login</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Contact</p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>
                <a href={`mailto:${email}`} className="hover:text-white break-all">{email}</a>
              </li>
              <li>
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-white">{phone}</a>
                {" / "}
                <a href={`tel:${phoneAlt.replace(/\s+/g, "")}`} className="hover:text-white">{phoneAlt}</a>
              </li>
              <li>{address}</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 text-xs text-gray-500">
          © {new Date().getFullYear()} TicketBuddy.pk. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

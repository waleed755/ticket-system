import Link from "next/link";
import { Container } from "@/components/ui";
import NewsletterForm from "@/components/site/newsletter-form";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-24">
      <Container className="py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 font-bold text-lg text-white mb-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm">G</span>
              Gatherly
            </div>
            <p className="text-sm text-gray-400 max-w-xs mb-4">
              A modern ticketing platform for conferences, festivals, and everything in between.
            </p>
            <NewsletterForm />
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Explore</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/events" className="hover:text-white">All Events</Link></li>
              <li><Link href="/events?priceType=FREE" className="hover:text-white">Free Events</Link></li>
              <li><Link href="/about" className="hover:text-white">About Us</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-semibold mb-3 text-sm">Support</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:text-white">Contact Us</Link></li>
              <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              <li><Link href="/refund-policy" className="hover:text-white">Refund Policy</Link></li>
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
        </div>
        <div className="mt-10 pt-6 border-t border-gray-800 text-xs text-gray-500">
          © {new Date().getFullYear()} Gatherly Inc. All rights reserved.
        </div>
      </Container>
    </footer>
  );
}

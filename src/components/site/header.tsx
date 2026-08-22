import Link from "next/link";
import { getSession } from "@/lib/auth";
import { LinkButton } from "@/components/ui";

const navLinks = [
  { href: "/events", label: "Browse Events" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Support" },
];

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-200">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm">G</span>
          Gatherly
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-gray-900">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.role === "CUSTOMER" ? (
            <LinkButton href="/account" variant="secondary" size="sm">
              My Account
            </LinkButton>
          ) : session ? (
            <LinkButton href="/admin" variant="secondary" size="sm">
              Staff Dashboard
            </LinkButton>
          ) : (
            <LinkButton href="/login" variant="secondary" size="sm">
              Sign in
            </LinkButton>
          )}
          <LinkButton href="/events" size="sm">
            Find Events
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

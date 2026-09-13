import Link from "next/link";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { LinkButton } from "@/components/ui";

const navLinks = [
  { href: "/events", label: "Events" },
  { href: "/for-organizers", label: "For Organizers" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="container-page flex h-28 items-center justify-between">
        <Link href="/" className="flex items-center shrink-0">
          <Image src="/logo.png" alt="Ticket Buddy" width={220} height={68} priority className="h-20 w-auto object-contain" />
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-ink">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-brand transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {session?.role === "CUSTOMER" ? (
            <LinkButton href="/account" variant="secondary" size="sm">
              My Tickets
            </LinkButton>
          ) : session ? (
            <LinkButton href="/admin" variant="secondary" size="sm">
              Staff Dashboard
            </LinkButton>
          ) : (
            <LinkButton href="/login" variant="secondary" size="sm">
              My Tickets
            </LinkButton>
          )}
          <LinkButton href="/events" size="sm" className="!bg-brand-gradient !bg-[length:200%_auto] hover:!bg-right transition-[background-position] duration-500">
            Explore Events
          </LinkButton>
        </div>
      </div>
    </header>
  );
}

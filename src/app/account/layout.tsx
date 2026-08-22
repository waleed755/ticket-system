import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Container } from "@/components/ui";
import LogoutButton from "@/components/site/logout-button";

const navItems = [
  { href: "/account", label: "Overview" },
  { href: "/account/bookings", label: "My Bookings" },
  { href: "/account/profile", label: "Profile & Password" },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "CUSTOMER") redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <Container className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-gray-900">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm">G</span>
            Gatherly
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">{session.fullName}</span>
            <LogoutButton />
          </div>
        </Container>
      </header>
      <Container className="py-8 grid md:grid-cols-[220px_1fr] gap-8">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:shadow-sm">
              {item.label}
            </Link>
          ))}
          <Link href="/events" className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-white mt-4">
            ← Browse events
          </Link>
        </nav>
        <div>{children}</div>
      </Container>
    </div>
  );
}

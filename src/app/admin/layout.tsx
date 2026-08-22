import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPermissions, roleLabels, ADMIN_ROLES } from "@/lib/permissions";
import { Container } from "@/components/ui";
import LogoutButton from "@/components/site/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || !ADMIN_ROLES.includes(session.role)) redirect("/login");
  const perms = getPermissions(session.role);

  const navGroups: { label: string; items: { href: string; label: string }[] }[] = [
    {
      label: "Overview",
      items: [{ href: "/admin", label: "Dashboard" }],
    },
    {
      label: "Events",
      items: perms.events !== "none" ? [
        { href: "/admin/events", label: "All Events" },
        ...(perms.events === "full" ? [{ href: "/admin/events/new", label: "Create Event" }] : []),
      ] : [],
    },
    {
      label: "Bookings",
      items: perms.bookings !== "none" ? [{ href: "/admin/bookings", label: "All Bookings" }] : [],
    },
    {
      label: "Finance",
      items: [
        ...(perms.refunds !== "none" ? [{ href: "/admin/refunds", label: "Refund Requests" }] : []),
        ...(perms.discounts !== "none" ? [{ href: "/admin/discounts", label: "Discount Codes" }] : []),
      ],
    },
    {
      label: "Communications",
      items: [{ href: "/admin/communications", label: "Emails & Announcements" }, { href: "/admin/contact-messages", label: "Contact Messages" }],
    },
    {
      label: "Insights",
      items: [
        ...(perms.reports !== "none" ? [{ href: "/admin/reports", label: "Reports" }] : []),
        { href: "/admin/activity", label: "Activity Log" },
      ],
    },
    {
      label: "Administration",
      items: [
        ...(perms.staff === "full" ? [{ href: "/admin/staff", label: "Staff & Permissions" }] : []),
        ...(perms.settings === "full" ? [{ href: "/admin/settings", label: "Site Settings" }] : []),
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-gray-900 text-gray-300 flex-shrink-0 hidden md:flex md:flex-col">
        <div className="h-16 flex items-center px-5 font-bold text-white text-lg gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white text-sm">G</span>
          Admin
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navGroups.filter((g) => g.items.length > 0).map((group) => (
            <div key={group.label}>
              <p className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link key={item.href} href={item.href} className="block px-2 py-1.5 rounded-lg text-sm hover:bg-gray-800 hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800 text-xs">
          <p className="text-white font-medium">{session.fullName}</p>
          <p className="text-gray-500">{roleLabels[session.role]}</p>
        </div>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-900">← View public site</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 md:hidden">{session.fullName}</span>
            <LogoutButton />
          </div>
        </header>
        <Container className="!max-w-none px-6 py-8">{children}</Container>
      </div>
    </div>
  );
}

import { prisma } from "@/lib/prisma";
import { Card, Badge, SectionHeading, LinkButton } from "@/components/ui";
import { roleLabels, ADMIN_ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

import StaffStatusToggle from "./staff-status-toggle";

export default async function AdminStaffPage() {
  const staff = await prisma.user.findMany({
    where: { role: { in: [...ADMIN_ROLES, "CHECKIN_STAFF"] } },
    include: { eventAssignments: { include: { event: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <SectionHeading title="Staff & permissions" description={`${staff.length} staff account(s)`} />
        <LinkButton href="/admin/staff/new">+ Add staff member</LinkButton>
      </div>

      <div className="grid gap-4">
        {staff.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900">{s.fullName}</p>
                  <Badge color={s.status === "ACTIVE" ? "green" : "gray"}>{s.status}</Badge>
                </div>
                <p className="text-sm text-gray-500">{s.email} · {roleLabels[s.role]}</p>
                {s.eventAssignments.length > 0 && (
                  <p className="text-xs text-gray-400 mt-1">Assigned to: {s.eventAssignments.map((a) => a.event.name).join(", ")}</p>
                )}
              </div>
              <StaffStatusToggle userId={s.id} status={s.status} />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

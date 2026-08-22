"use server";

import { prisma } from "@/lib/prisma";
import { requireRole, hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { revalidatePath } from "next/cache";
import type { Role } from "@prisma/client";

export async function createStaffAction(input: { fullName: string; email: string; role: Role; password: string; eventIds: string[] }) {
  const session = await requireRole(["ADMIN"]);
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      role: input.role,
      passwordHash,
      status: "ACTIVE",
      eventAssignments:
        input.role === "EVENT_MANAGER" || input.role === "CHECKIN_STAFF"
          ? { create: input.eventIds.map((eventId) => ({ eventId, role: input.role })) }
          : undefined,
    },
  });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "staff.created", entityType: "USER", entityId: user.id, description: `Staff account created for ${user.fullName} (${input.role}).` });
  revalidatePath("/admin/staff");
  return { ok: true as const };
}

export async function updateStaffStatusAction(userId: string, status: "ACTIVE" | "INACTIVE") {
  const session = await requireRole(["ADMIN"]);
  const user = await prisma.user.update({ where: { id: userId }, data: { status } });
  await logActivity({
    actorId: session.userId,
    actorName: session.fullName,
    action: "staff.status_changed",
    entityType: "USER",
    entityId: userId,
    description: `${user.fullName} set to ${status}.`,
  });
  revalidatePath("/admin/staff");
  return { ok: true as const };
}

export async function updateStaffAssignmentsAction(userId: string, eventIds: string[]) {
  const session = await requireRole(["ADMIN"]);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  await prisma.eventAssignment.deleteMany({ where: { userId } });
  await prisma.eventAssignment.createMany({ data: eventIds.map((eventId) => ({ userId, eventId, role: user.role })) });
  await logActivity({ actorId: session.userId, actorName: session.fullName, action: "staff.assignments_changed", entityType: "USER", entityId: userId, description: `Event assignments updated for ${user.fullName}.` });
  revalidatePath("/admin/staff");
  return { ok: true as const };
}

import { prisma } from "./prisma";

export async function logActivity(params: {
  actorId?: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId?: string;
  description: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
}) {
  await prisma.activityLog.create({
    data: {
      actorId: params.actorId ?? null,
      actorName: params.actorName,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      description: params.description,
      previousValue: params.previousValue ? JSON.stringify(params.previousValue) : null,
      newValue: params.newValue ? JSON.stringify(params.newValue) : null,
      reason: params.reason,
    },
  });
}

import { prisma } from "./prisma";
import type { SessionPayload } from "./auth";

// Returns the event ids a staff member is allowed to see, or "ALL".
export async function getScopedEventIds(session: SessionPayload): Promise<string[] | "ALL"> {
  if (session.role === "EVENT_MANAGER") {
    const assignments = await prisma.eventAssignment.findMany({ where: { userId: session.userId }, select: { eventId: true } });
    return assignments.map((a) => a.eventId);
  }
  return "ALL";
}

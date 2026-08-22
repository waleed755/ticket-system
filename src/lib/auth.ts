import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "session_token";
const SECRET = process.env.SESSION_SECRET || "dev-secret";

export interface SessionPayload {
  userId: string;
  role: Role;
  email: string;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function requireRole(roles: Role[]): Promise<SessionPayload> {
  const session = await requireSession();
  if (!roles.includes(session.role)) throw new Error("FORBIDDEN");
  return session;
}

export const STAFF_ROLES: Role[] = [
  "ADMIN",
  "EVENT_MANAGER",
  "BOOKING_MANAGER",
  "FINANCE_MANAGER",
  "SUPPORT",
  "CHECKIN_STAFF",
];

export async function getEventIdsForStaff(userId: string, role: Role): Promise<string[] | "ALL"> {
  if (role === "ADMIN" || role === "BOOKING_MANAGER" || role === "FINANCE_MANAGER" || role === "SUPPORT") {
    return "ALL";
  }
  const assignments = await prisma.eventAssignment.findMany({
    where: { userId },
    select: { eventId: true },
  });
  return assignments.map((a) => a.eventId);
}

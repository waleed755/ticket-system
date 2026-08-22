"use server";

import { prisma } from "@/lib/prisma";
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth";
import { sendEmail, emailTemplates } from "@/lib/email";
import { generateToken } from "@/lib/ids";

export async function loginAction(input: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  if (!user || !user.passwordHash) {
    return { ok: false as const, message: "Invalid email or password." };
  }
  if (user.status === "INACTIVE") {
    return { ok: false as const, message: "This account has been deactivated. Contact support for help." };
  }
  const valid = await verifyPassword(input.password, user.passwordHash);
  if (!valid) return { ok: false as const, message: "Invalid email or password." };

  await createSession({ userId: user.id, role: user.role, email: user.email, fullName: user.fullName });
  return { ok: true as const, role: user.role };
}

export async function logoutAction() {
  await destroySession();
}

export async function activateAccountAction(input: { token: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { activationToken: input.token } });
  if (!user) return { ok: false as const, message: "This activation link is invalid or has already been used." };
  if (user.activationTokenExpires && user.activationTokenExpires < new Date()) {
    return { ok: false as const, message: "This activation link has expired. Request a new one from the login page." };
  }
  if (input.password.length < 8) return { ok: false as const, message: "Password must be at least 8 characters." };

  const passwordHash = await hashPassword(input.password);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, status: "ACTIVE", activationToken: null, activationTokenExpires: null },
  });
  await createSession({ userId: updated.id, role: updated.role, email: updated.email, fullName: updated.fullName });
  return { ok: true as const };
}

export async function requestPasswordResetAction(input: { email: string }) {
  const user = await prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } });
  // Always return success to avoid leaking which emails have accounts.
  if (!user) return { ok: true as const, message: "If an account exists for that email, a reset link has been sent." };

  const token = generateToken();
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordResetToken: token, passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000) },
  });
  await sendEmail({
    toEmail: user.email,
    toUserId: user.id,
    subject: "Reset your password",
    bodyHtml: emailTemplates.passwordReset({ fullName: user.fullName, resetUrl: `${process.env.APP_URL}/reset-password/${token}` }),
    previewText: "Reset your password",
    category: "PASSWORD_RESET",
  });
  return { ok: true as const, message: "If an account exists for that email, a reset link has been sent." };
}

export async function resetPasswordAction(input: { token: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { passwordResetToken: input.token } });
  if (!user) return { ok: false as const, message: "This reset link is invalid or has already been used." };
  if (user.passwordResetExpires && user.passwordResetExpires < new Date()) {
    return { ok: false as const, message: "This reset link has expired. Request a new one." };
  }
  if (input.password.length < 8) return { ok: false as const, message: "Password must be at least 8 characters." };

  const passwordHash = await hashPassword(input.password);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, status: "ACTIVE" },
  });
  return { ok: true as const };
}

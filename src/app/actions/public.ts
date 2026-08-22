"use server";

import { prisma } from "@/lib/prisma";

export async function subscribeNewsletter(formData: FormData) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email || !email.includes("@")) return { ok: false, message: "Enter a valid email address." };

  await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: { active: true },
    create: { email },
  });
  return { ok: true, message: "You're subscribed! Watch your inbox for event updates." };
}

export async function submitContactMessage(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const subject = String(formData.get("subject") || "").trim();
  const message = String(formData.get("message") || "").trim();

  if (!name || !email || !subject || !message) {
    return { ok: false, message: "Please fill in all fields." };
  }

  await prisma.contactMessage.create({ data: { name, email, subject, message } });
  return { ok: true, message: "Thanks — we've received your message and will respond within one business day." };
}

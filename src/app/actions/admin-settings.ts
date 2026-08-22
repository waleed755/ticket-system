"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function updatePageAction(slug: string, title: string, content: string) {
  await requireRole(["ADMIN"]);
  await prisma.page.update({ where: { slug }, data: { title, content } });
  revalidatePath("/admin/settings");
  revalidatePath(`/${slug}`);
  return { ok: true as const };
}

export async function updateSiteSettingAction(key: string, value: string) {
  await requireRole(["ADMIN"]);
  await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  revalidatePath("/admin/settings");
  return { ok: true as const };
}

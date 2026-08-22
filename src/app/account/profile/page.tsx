import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionHeading } from "@/components/ui";
import { ProfileForm, PasswordForm } from "./profile-forms";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session!.userId } });

  return (
    <div className="space-y-6">
      <SectionHeading title="Profile & password" />
      <ProfileForm fullName={user.fullName} phone={user.phone ?? ""} />
      <PasswordForm />
    </div>
  );
}

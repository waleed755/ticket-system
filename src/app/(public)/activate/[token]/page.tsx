import { prisma } from "@/lib/prisma";
import { Container, Card, Alert, LinkButton } from "@/components/ui";
import ActivateForm from "./activate-form";

export const dynamic = "force-dynamic";

export default async function ActivatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await prisma.user.findUnique({ where: { activationToken: token } });

  return (
    <Container className="py-16 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Activate your account</h1>
        <p className="text-sm text-gray-500 mt-1">Set a password to unlock full access to your bookings.</p>
      </div>
      <Card className="p-6">
        {!user || (user.activationTokenExpires && user.activationTokenExpires < new Date()) ? (
          <div>
            <Alert variant="error">This activation link is invalid or has expired.</Alert>
            <div className="mt-4 text-center">
              <LinkButton href="/forgot-password" variant="secondary">Request a new link</LinkButton>
            </div>
          </div>
        ) : (
          <ActivateForm token={token} />
        )}
      </Card>
    </Container>
  );
}

import { Container, Card } from "@/components/ui";
import ResetForm from "./reset-form";

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Container className="py-16 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Choose a new password</h1>
      </div>
      <Card className="p-6">
        <ResetForm token={token} />
      </Card>
    </Container>
  );
}

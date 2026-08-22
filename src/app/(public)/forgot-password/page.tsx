import { Container, Card } from "@/components/ui";
import ForgotForm from "./forgot-form";

export default function ForgotPasswordPage() {
  return (
    <Container className="py-16 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-1">We&apos;ll email you a secure link to choose a new password.</p>
      </div>
      <Card className="p-6">
        <ForgotForm />
      </Card>
    </Container>
  );
}

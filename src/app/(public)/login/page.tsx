import { Container, Card } from "@/components/ui";
import LoginForm from "./login-form";

export default function LoginPage() {
  return (
    <Container className="py-16 max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
        <p className="text-sm text-gray-500 mt-1">Customers and staff both sign in here.</p>
      </div>
      <Card className="p-6">
        <LoginForm />
      </Card>
      <p className="text-center text-xs text-gray-400 mt-6">
        Booked as a guest? You don&apos;t need an account to view a confirmed booking — use the link in your confirmation email.
      </p>
    </Container>
  );
}

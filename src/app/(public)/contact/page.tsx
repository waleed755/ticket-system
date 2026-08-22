import { Container, SectionHeading, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import ContactForm from "./contact-form";

export default async function ContactPage() {
  const [page, settings] = await Promise.all([
    prisma.page.findUnique({ where: { slug: "contact" } }),
    prisma.siteSetting.findMany(),
  ]);
  const email = settings.find((s) => s.key === "support_email")?.value ?? "support@gatherly.events";
  const phone = settings.find((s) => s.key === "support_phone")?.value ?? "";

  return (
    <Container className="py-14">
      <SectionHeading eyebrow="We're here to help" title={page?.title ?? "Contact & Support"} description={page?.content} />
      <div className="grid lg:grid-cols-3 gap-8">
        <Card className="p-6 lg:col-span-2">
          <h2 className="font-semibold text-gray-900 mb-4">Send us a message</h2>
          <ContactForm />
        </Card>
        <div className="space-y-4">
          <Card className="p-6">
            <p className="font-semibold text-gray-900 mb-1">Email</p>
            <p className="text-sm text-brand">{email}</p>
          </Card>
          <Card className="p-6">
            <p className="font-semibold text-gray-900 mb-1">Phone</p>
            <p className="text-sm text-gray-600">{phone}</p>
          </Card>
          <Card className="p-6">
            <p className="font-semibold text-gray-900 mb-1">Response time</p>
            <p className="text-sm text-gray-600">We typically respond within one business day.</p>
          </Card>
        </div>
      </div>
    </Container>
  );
}

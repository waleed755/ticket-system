import { Container, SectionHeading, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function AboutPage() {
  const page = await prisma.page.findUnique({ where: { slug: "about" } });
  return (
    <Container className="py-14 max-w-3xl">
      <SectionHeading eyebrow="Who we are" title={page?.title ?? "About Ticket Buddy"} />
      <div className="prose-body text-gray-700 whitespace-pre-line">{page?.content}</div>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {[
          { title: "Simple, secure payments", body: "Pay by bank transfer or QR code and upload proof of payment — verified by our team before your booking is confirmed." },
          { title: "Instant digital tickets", body: "Unique, scannable tickets delivered by email the moment payment is verified." },
          { title: "PKR pricing", body: "All events, all ticket categories — priced clearly in Pakistani Rupees." },
        ].map((s) => (
          <Card key={s.title} className="p-5">
            <p className="font-semibold text-gray-900 mb-1">{s.title}</p>
            <p className="text-sm text-gray-500">{s.body}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}

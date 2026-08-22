import { Container, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function FAQPage() {
  const faqs = await prisma.siteFAQ.findMany({ orderBy: { position: "asc" } });
  return (
    <Container className="py-14 max-w-3xl">
      <SectionHeading eyebrow="Help center" title="Frequently asked questions" />
      <div className="divide-y divide-gray-200">
        {faqs.map((f) => (
          <div key={f.id} className="py-5">
            <p className="font-semibold text-gray-900 mb-1">{f.question}</p>
            <p className="text-sm text-gray-600">{f.answer}</p>
          </div>
        ))}
      </div>
    </Container>
  );
}

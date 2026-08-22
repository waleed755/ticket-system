import { Container, SectionHeading, Card } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function AboutPage() {
  const page = await prisma.page.findUnique({ where: { slug: "about" } });
  return (
    <Container className="py-14 max-w-3xl">
      <SectionHeading eyebrow="Who we are" title={page?.title ?? "About Gatherly"} />
      <div className="prose-body text-gray-700 whitespace-pre-line">{page?.content}</div>
      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        {[
          { stat: "2,500+", label: "Events hosted" },
          { stat: "480K+", label: "Tickets sold" },
          { stat: "98%", label: "On-time check-in rate" },
        ].map((s) => (
          <Card key={s.label} className="p-5 text-center">
            <p className="text-2xl font-bold text-gray-900">{s.stat}</p>
            <p className="text-sm text-gray-500">{s.label}</p>
          </Card>
        ))}
      </div>
    </Container>
  );
}

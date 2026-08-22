import { Container, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function TermsPage() {
  const page = await prisma.page.findUnique({ where: { slug: "terms" } });
  return (
    <Container className="py-14 max-w-3xl">
      <SectionHeading eyebrow="Legal" title={page?.title ?? "Terms and Conditions"} />
      <div className="prose-body text-gray-700 whitespace-pre-line">{page?.content}</div>
    </Container>
  );
}

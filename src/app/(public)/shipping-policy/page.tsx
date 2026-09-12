import { Container, SectionHeading } from "@/components/ui";
import { prisma } from "@/lib/prisma";

export default async function ShippingPolicyPage() {
  const page = await prisma.page.findUnique({ where: { slug: "shipping-policy" } });
  return (
    <Container className="py-14 max-w-3xl">
      <SectionHeading eyebrow="Policy" title={page?.title ?? "Shipping / Delivery Policy"} />
      <div className="prose-body text-gray-700 whitespace-pre-line">{page?.content}</div>
    </Container>
  );
}

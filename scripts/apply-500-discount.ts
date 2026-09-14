// One-time promo: auto-apply a flat Rs 500 discount to every visible ticket
// category of the live event, using the new compareAtPrice field so the
// storefront shows the original price struck through next to the new sale
// price everywhere (event card, event detail sidebar, booking wizard).
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DISCOUNT_PAISA = 50000; // Rs 500

async function main() {
  const event = await prisma.event.findFirstOrThrow({
    where: { slug: "actual-wala-live-adnan-dhool-live-in-concert" },
    include: { ticketCategories: true },
  });

  for (const category of event.ticketCategories) {
    if (category.price <= DISCOUNT_PAISA) {
      console.log(`Skipping ${category.name} — price too low for a Rs 500 discount.`);
      continue;
    }
    const newPrice = category.price - DISCOUNT_PAISA;
    await prisma.ticketCategory.update({
      where: { id: category.id },
      data: { price: newPrice, compareAtPrice: category.price },
    });
    console.log(`${category.name}: ${category.price / 100} -> ${newPrice / 100} (was ${category.price / 100})`);
  }

  console.log("\nDone.");
}

main().finally(() => prisma.$disconnect());

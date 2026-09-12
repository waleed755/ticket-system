import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const settings: Record<string, string> = {
    support_email: "tickets@ticketbuddy.pk",
    support_phone: "0347 6581443",
    support_phone_alt: "0304 1549196",
    business_address: "604 N Block, Samanabad, Lahore, Pakistan",
  };

  for (const [key, value] of Object.entries(settings)) {
    await prisma.siteSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
  }

  console.log("Site settings updated:", settings);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
